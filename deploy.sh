#!/bin/bash
set -e

# The slug. Preview is served from preview.88restaurants.com/${SITE_NAME}/,
# and it is what new-site.sh stamps. Edit once per client.
SITE_NAME="pd-thai"

# The live domain, e.g. "casasanchezrestaurants.com". Production is a vhost on
# the same box as preview, keyed by domain rather than by slug — the two names
# are usually different and only sometimes the same, so this is its own knob.
# Left empty until the client has a domain; production refuses to run without it.
PROD_DOMAIN="pdthaiaustin.com"

# The server's monthly reviews cron (~/bin/server-monthly.sh) reads PROD_DEST
# from this file, resolving ${PROD_DOMAIN}: keep both simple assignments.
PROD_DEST="rg@104.237.128.61:/var/www/${PROD_DOMAIN}/_site"
PREVIEW_DEST="rg@104.237.128.61:/var/www/preview.88restaurants.com/_site/${SITE_NAME}/"

# Pages the deployed site must keep serving (the guard before the --delete rsync
# below). The legacy redirect stubs are added from their data file.
REQUIRED_PAGES="index.html 404.html menus/index.html gallery/index.html catering/index.html parties/index.html assets/css/styles.css"

# ---------------------------------------------------------------------------
# Usage:
#   ./deploy.sh                    prompts for a target
#   ./deploy.sh preview            non-interactive (what automation uses)
#   ./deploy.sh production         needs a terminal and the typed domain
#   ./deploy.sh production --confirm <domain> --note "<request>" [--dry-run]
#   ./deploy.sh rollback [--confirm <domain> --note "<request>"]
#
# --note is required with --confirm: it records the owner's chat request in
# the ledger, so every unattended production write says who asked for it.
#
# Production has two doors. A person at a terminal types the domain. The
# --confirm door runs without a terminal, and it is the only way Claude may
# deploy to production: only when the owner asks for this specific site in
# chat, never from a scheduled task, and never for the app repos (rg_new and
# the rest stay PR-only). --confirm refuses unless every one of these holds:
#   1. <domain> equals PROD_DOMAIN. This is the typed-domain check, passed as
#      an argument: it stops a deploy to the wrong site.
#   2. The git tree is clean, on main, and equal to origin/main (the monthly
#      reviews cron rebuilds from origin/main and would undo anything else).
#   3. The site-check skill passes on the exact build being shipped.
#   4. The same commit is already on preview: `./deploy.sh preview` from that
#      commit records it on the server (~/deploy-state/preview/<slug>).
# --dry-run runs every guard and the build, then a read-only `rsync -n`.
#
# Every production deploy (either door) first copies the live _site to
# ~/site-backups/<domain>/prev on the server, and `./deploy.sh rollback` swaps
# it back (a second rollback swaps again). Every run appends a line to the
# deploy ledger: DEPLOY_LEDGER, default ~/.claude/plans/deploy-ledger.tsv,
# skipped with a notice when that folder does not exist.
# ---------------------------------------------------------------------------
MODE="${1:-}"
[[ $# -gt 0 ]] && shift
CONFIRM=""
CONFIRM_SET=""
DRY_RUN=""
NOTE=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --confirm) CONFIRM="${2:-}"; CONFIRM_SET=1; shift; [[ $# -gt 0 ]] && shift ;;
    --dry-run) DRY_RUN=1; shift ;;
    --note) NOTE="${2:-}"; shift; [[ $# -gt 0 ]] && shift ;;
    *) echo "Unknown argument: $1"; MODE="usage"; break ;;
  esac
done

PROD_HOST="${PROD_DEST%%:*}"
PROD_ROOT="${PROD_DEST#*:}"
PREVIEW_HOST="${PREVIEW_DEST%%:*}"
SITE_CHECK="${SITE_CHECK:-$HOME/.claude/skills/site-check/check.js}"

# --- Deploy ledger ----------------------------------------------------------
LEDGER="${DEPLOY_LEDGER:-$HOME/.claude/plans/deploy-ledger.tsv}"
COMMIT="$(git rev-parse --short=12 HEAD 2>/dev/null || echo nogit)"
[[ -z "$(git status --porcelain 2>/dev/null)" ]] || COMMIT="${COMMIT}-dirty"
LEDGER_TARGET="-"
LEDGER_MODE="${MODE:-prompt}"
RESULT=""
refuse() {
  echo "❌ $1"
  RESULT="refused: $1"
  exit 1
}
write_ledger() {
  local rc=$1 dir
  dir="$(dirname "$LEDGER")"
  if [[ ! -d "$dir" ]]; then
    echo "(deploy ledger skipped: $dir does not exist)"
    return 0
  fi
  if [[ -z "$RESULT" ]]; then
    if [[ $rc -eq 0 ]]; then RESULT="ok"; else RESULT="failed (exit $rc)"; fi
  fi
  [[ -f "$LEDGER" ]] || printf 'date\tsite\ttarget\tcommit\tmode\tresult\tnote\n' > "$LEDGER"
  printf '%s\t%s\t%s\t%s\t%s\t%s\t%s\n' "$(date '+%Y-%m-%dT%H:%M:%S%z')" "$SITE_NAME" \
    "$LEDGER_TARGET" "$COMMIT" "$LEDGER_MODE" "$RESULT" "$(printf '%s' "$NOTE" | tr '\t\n' '  ')" >> "$LEDGER"
}
trap 'write_ledger $?' EXIT

# --- Server-side records ----------------------------------------------------
# What a build ships, as "<sha> <tree>". A dirty working tree adds "-dirty" to
# the sha, so a preview of uncommitted work never satisfies guard 4.
tree_state() {
  local sha tree
  sha="$(git rev-parse HEAD 2>/dev/null || echo nogit)"
  tree="$(git rev-parse 'HEAD^{tree}' 2>/dev/null || echo nogit)"
  [[ -z "$(git status --porcelain 2>/dev/null)" ]] || sha="${sha}-dirty"
  echo "$sha $tree"
}
# Prints the record (empty when there is none); fails only when ssh does.
read_preview_mark() {
  ssh -o BatchMode=yes -o ConnectTimeout=15 "$PREVIEW_HOST" \
    "cat ~/deploy-state/preview/${SITE_NAME} 2>/dev/null || true"
}
# Copy the live webroot (and its redirects conf and recorded commit) to
# ~/site-backups/<domain>/prev. An .inflight flag marks a production deploy
# that has not finished: while it is there, a retry keeps the existing backup
# instead of overwriting it with a half-deployed site.
backup_live() {
  ssh "$PROD_HOST" bash -s -- "$PROD_DOMAIN" "$PROD_ROOT" <<'REMOTE'
    set -e
    D="$1"; W="${2%/}"; B="$HOME/site-backups/$D"; ST="$HOME/deploy-state/prod"
    mkdir -p "$B" "$ST"
    if [ -f "$ST/$D.inflight" ]; then
      echo "The last production deploy of $D did not finish: keeping the existing backup."
    elif [ -d "$W" ]; then
      rsync -a --delete --exclude=/_versions/ "$W/" "$B/prev/"
      if [ -f "$HOME/nginx/$D.redirects.conf" ]; then
        cp "$HOME/nginx/$D.redirects.conf" "$B/prev.redirects.conf"
      else
        rm -f "$B/prev.redirects.conf"
      fi
      cat "$ST/$D" > "$B/prev.commit" 2>/dev/null || echo "unknown" > "$B/prev.commit"
      echo "Backed up the live site to $B/prev"
    else
      echo "No live site at $W yet: nothing to back up."
    fi
    touch "$ST/$D.inflight"
REMOTE
}
# Swap ~/site-backups/<domain>/prev and the live webroot (files, redirects
# conf, recorded commit), with the same rsync flags and _versions protection
# as the deploy. Prints "Restored: <sha> <tree>" last.
rollback_live() {
  ssh "$PROD_HOST" bash -s -- "$PROD_DOMAIN" "$PROD_ROOT" <<'REMOTE'
    set -e
    D="$1"; W="${2%/}"; B="$HOME/site-backups/$D"; ST="$HOME/deploy-state/prod"
    R="$HOME/nginx/$D.redirects.conf"
    if [ ! -d "$B/prev" ]; then echo "No backup at $B/prev: nothing to roll back to."; exit 3; fi
    if [ ! -d "$W" ]; then echo "No live webroot at $W."; exit 3; fi
    rm -rf "$B/swap"
    rsync -a --delete --exclude=/_versions/ "$W/" "$B/swap/"
    # P /_versions/*** protects the directory itself, not only its contents: the
    # backup has no _versions/, and rsync 3.x otherwise warns that it "cannot
    # delete non-empty directory: _versions".
    rsync -rltO --delete --filter='P /_versions/***' "$B/prev/" "$W/"
    if [ -f "$R" ]; then cp "$R" "$B/swap.redirects.conf"; else rm -f "$B/swap.redirects.conf"; fi
    if [ -f "$B/prev.redirects.conf" ]; then cp "$B/prev.redirects.conf" "$R"; fi
    cat "$ST/$D" > "$B/swap.commit" 2>/dev/null || echo "unknown" > "$B/swap.commit"
    mkdir -p "$ST"
    cp "$B/prev.commit" "$ST/$D" 2>/dev/null || echo "unknown" > "$ST/$D"
    rm -rf "$B/prev"
    mv "$B/swap" "$B/prev"
    rm -f "$B/prev.redirects.conf"
    if [ -f "$B/swap.redirects.conf" ]; then mv "$B/swap.redirects.conf" "$B/prev.redirects.conf"; fi
    mv "$B/swap.commit" "$B/prev.commit"
    rm -f "$ST/$D.inflight"
    echo "Restored: $(cat "$ST/$D")"
REMOTE
}

if [[ "$MODE" == "preview" ]]; then
  choice=2
elif [[ "$MODE" == "production" ]]; then
  choice=1
elif [[ "$MODE" == "rollback" ]]; then
  choice=3
elif [[ -n "$MODE" ]]; then
  echo "Usage: ./deploy.sh [preview|production|rollback] [--confirm <domain> --note \"<request>\"] [--dry-run]"
  RESULT="refused: usage"
  exit 1
else
  echo "Where do you want to deploy?"
  echo "  1) Production"
  echo "  2) Preview"
  read -rp "Enter choice [1-2]: " choice
fi

if [[ "$choice" != "1" ]]; then
  [[ -z "$DRY_RUN" ]] || refuse "--dry-run is only for production --confirm <domain>"
  [[ "$choice" == "3" || -z "$CONFIRM_SET" ]] || refuse "--confirm is only for production and rollback"
fi

case "$choice" in
  1)
    if [[ -z "$PROD_DOMAIN" ]]; then
      echo "❌ PROD_DOMAIN is empty — set it to the live domain at the top of this script."
      echo "   Production is /var/www/<domain>/_site on rg@104.237.128.61."
      RESULT="refused: PROD_DOMAIN is empty"
      exit 1
    fi
    TARGET="$PROD_DEST"
    ENV="production"
    LEDGER_TARGET="$PROD_DOMAIN"
    if [[ -n "$CONFIRM_SET" ]]; then
      # The --confirm door: guards 1 and 2 here, 3 and 4 after the build.
      LEDGER_MODE="production --confirm"
      [[ -n "$DRY_RUN" ]] && LEDGER_MODE="production --confirm --dry-run"
      [[ "$CONFIRM" == "$PROD_DOMAIN" ]] || refuse "--confirm '${CONFIRM}' does not match PROD_DOMAIN (${PROD_DOMAIN})"
      [[ -n "$NOTE" ]] || refuse "--confirm needs --note \"<the owner's chat request>\" for the ledger"
      git rev-parse --is-inside-work-tree >/dev/null 2>&1 || refuse "not a git repository"
      [[ -z "$(git status --porcelain)" ]] || refuse "the git tree is not clean (see git status)"
      BRANCH="$(git symbolic-ref --short -q HEAD || true)"
      [[ "$BRANCH" == "main" ]] || refuse "not on main (on '${BRANCH:-a detached HEAD}')"
      git fetch -q origin main || refuse "could not fetch origin main to compare"
      [[ "$(git rev-parse HEAD)" == "$(git rev-parse FETCH_HEAD)" ]] \
        || refuse "HEAD is not origin/main (push or pull first)"
      [[ -f "$SITE_CHECK" ]] || refuse "site-check not found at ${SITE_CHECK}"
    else
      [[ -z "$DRY_RUN" ]] || refuse "--dry-run needs --confirm <domain>"
      if [[ ! -t 0 ]]; then
        echo "❌ Without a terminal, production needs --confirm <domain> (see the top of this script)."
        echo "   Claude may use it only when the owner asks for this site in chat."
        RESULT="refused: no terminal and no --confirm"
        exit 1
      fi
      # Confirm against the domain, not the slug: the domain is what gets
      # overwritten, and --delete has no undo.
      read -rp "⚠️  This deploys to the LIVE site. Type the domain (${PROD_DOMAIN}) to continue: " confirm
      [[ "$confirm" == "$PROD_DOMAIN" ]] || { echo "Aborted — name did not match."; RESULT="refused: typed domain did not match"; exit 1; }
    fi
    ;;
  2)
    TARGET="$PREVIEW_DEST"
    ENV="preview"
    LEDGER_TARGET="preview/${SITE_NAME}"
    ;;
  3)
    LEDGER_MODE="rollback"
    [[ -n "$PROD_DOMAIN" ]] || refuse "PROD_DOMAIN is empty: nothing to roll back"
    LEDGER_TARGET="$PROD_DOMAIN"
    if [[ -n "$CONFIRM_SET" ]]; then
      [[ "$CONFIRM" == "$PROD_DOMAIN" ]] || refuse "--confirm '${CONFIRM}' does not match PROD_DOMAIN (${PROD_DOMAIN})"
      [[ -n "$NOTE" ]] || refuse "--confirm needs --note \"<the owner's chat request>\" for the ledger"
    elif [[ -t 0 ]]; then
      read -rp "⚠️  This swaps the previous LIVE site back in. Type the domain (${PROD_DOMAIN}) to continue: " confirm
      [[ "$confirm" == "$PROD_DOMAIN" ]] || refuse "typed domain did not match"
    else
      refuse "rollback needs a terminal or --confirm <domain>"
    fi
    echo "Rolling back ${PROD_DOMAIN}..."
    OUT="$(mktemp)"
    set +e
    rollback_live > "$OUT" 2>&1
    rc=$?
    set -e
    cat "$OUT"
    RESTORED="$(sed -n 's/^Restored: //p' "$OUT")"
    rm -f "$OUT"
    [[ $rc -eq 0 ]] || refuse "rollback failed on the server (exit $rc; output above)"
    COMMIT="${RESTORED:0:12}"
    echo "Updating the server config..."
    ssh "$PROD_HOST" "sudo ~/bin/site-nginx ${PROD_DOMAIN} --redirects ~/nginx/${PROD_DOMAIN}.redirects.conf"
    echo "Rollback of ${PROD_DOMAIN} complete (now live: ${RESTORED:-unknown})."
    exit 0
    ;;
  *)
    echo "Invalid choice. Aborting."
    exit 1
    ;;
esac

echo "Building site for ${ENV}..."
if [[ "$ENV" == "preview" ]]; then
  # Preview is served from a /${SITE_NAME}/ subfolder, so build with that prefix.
  PATH_PREFIX="/${SITE_NAME}/" npm run build:preview
else
  npm run build
fi

# The rsync below uses --delete, so a broken/partial build would wipe live
# pages. Sanity-check the critical paths first.
#
# The legacy redirect stubs are read from their own data file rather than
# copied into the list by hand: they are the only thing keeping the replaced
# site's URLs alive, and a hand-maintained copy drifts silently — someone
# edits src/legacy-redirects.njk, the stubs stop being written, the guard
# still passes, and --delete removes the live menus.html. Reading the source
# of truth means the check cannot fall out of step with it. A from that ends
# in "/" is built as <from>index.html. Empty file, empty list, no change in
# behaviour.
LEGACY=$(node -p "require('./src/_data/legacyRedirects.js').map(function(r){var f=r.from.replace(/^\//,'');return f===''||/\/$/.test(f)?f+'index.html':f}).join(' ')" 2>/dev/null || echo "")
for f in $REQUIRED_PAGES $LEGACY; do
  [[ -f "dist/$f" ]] || {
    echo "❌ dist/$f missing — aborting deploy."
    exit 1
  }
done

# The --confirm door, guards 3 and 4, on the build that is about to ship.
if [[ "$ENV" == "production" && -n "$CONFIRM_SET" ]]; then
  [[ -z "$(git status --porcelain)" ]] \
    || refuse "the build changed tracked files (see git status): commit them, deploy preview, then retry"
  echo "Running site-check on this build..."
  node "$SITE_CHECK" dist || refuse "site-check failed on this build (ERRORs above)"
  SHIP="$(tree_state)"
  ON_PREVIEW="$(read_preview_mark)" || refuse "could not read the preview record from ${PREVIEW_HOST}"
  if [[ "${ON_PREVIEW%% *}" != "${SHIP%% *}" ]]; then
    HINT=""
    case "${ON_PREVIEW%% *}" in
      *-dirty) HINT="; preview was deployed from uncommitted work: run ./deploy.sh preview on main, then retry" ;;
      *) [[ -n "$ON_PREVIEW" && "${ON_PREVIEW#* }" == "${SHIP#* }" ]] \
           && HINT="; same files, different commit: run ./deploy.sh preview on main, then retry" ;;
    esac
    refuse "commit ${SHIP:0:12} is not on preview (preview has: ${ON_PREVIEW:-no record})${HINT}"
  fi
  echo "✅ All four --confirm guards passed (preview has ${ON_PREVIEW:0:12})."
fi

SHIP="${SHIP:-$(tree_state)}"
RSYNC_DRY=""
if [[ -n "$DRY_RUN" ]]; then
  RSYNC_DRY="-ni"
elif [[ "$ENV" == "preview" ]]; then
  # Cleared first, so a failed upload leaves no record that this commit is on preview.
  ssh "$PREVIEW_HOST" "rm -f ~/deploy-state/preview/${SITE_NAME}"
else
  echo "Backing up the live site..."
  backup_live
fi

echo "Deploying to ${ENV}..."
# _versions/ holds every CSS/JS version ever deployed (see .eleventy.js): the
# server answers an older ?v= from it, so --delete must leave it alone.
#
# -rltzvO rather than -a: nearly every webroot on the box (147 of 149 in
# 2026-09) is a www-data-owned _site/, and many hold www-data-owned files
# too. -a's -p tries to chmod the root to this machine's 755 and -t tries to
# set its mtime; the deploy user may do neither on a directory it does not
# own. That is rsync exit 23 after every file has landed, and set -e then
# skips the production nginx step below. That is how mazzaros shipped with
# no 404 page, no gzip and no caching. Without -p, existing modes are left as
# they are and new files take the server's umask. -O skips directory mtimes,
# the same as server-monthly.sh. Changed files are still replaced whole,
# never edited in place, so a www-data-owned file is swapped for one the
# deploy user owns. macOS's stock openrsync takes both flags.
# restaurant-template's scripts/test/deploy-rsync.sh reads this line's flags.
# $RSYNC_DRY is -ni (no writes, itemized) for --dry-run, otherwise empty.
rsync $RSYNC_DRY -rltzvO --delete --filter='P /_versions/**' dist/ "$TARGET"

if [[ -n "$DRY_RUN" ]]; then
  echo "Dry run: every guard passed and the list above is what would change. Nothing was written."
  RESULT="dry run ok"
  exit 0
fi

if [[ "$ENV" == "preview" ]]; then
  ssh "$PREVIEW_HOST" "mkdir -p ~/deploy-state/preview && echo '${SHIP}' > ~/deploy-state/preview/${SITE_NAME}"
fi

# Production only (preview shares one vhost): gzip, caching (?v= asset URLs a
# year, everything else re-checked on every visit, so a deploy is live at once),
# the site's 404 page, and a real 301 for each legacy redirect. site-nginx is in
# the template's server/client/ folder; it reports "no change" when nothing differs.
if [[ "$ENV" == "production" ]]; then
  echo "Updating the server config..."
  PROD_HOST="${PROD_DEST%%:*}"
  REDIRECTS="$(mktemp)"
  if [[ -f src/_data/legacyRedirects.js ]]; then
    node -e '
      for (const r of require("./src/_data/legacyRedirects.js")) {
        const from = r.from.replace(/\/$/, "");
        if (!from) continue;
        const pattern = from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        console.log(`location ~ ^${pattern}/?$ { return 301 ${r.to}; }`);
      }' > "$REDIRECTS"
  fi
  scp -q "$REDIRECTS" "${PROD_HOST}:nginx/${PROD_DOMAIN}.redirects.conf"
  rm -f "$REDIRECTS"
  ssh "$PROD_HOST" "sudo ~/bin/site-nginx ${PROD_DOMAIN} --redirects ~/nginx/${PROD_DOMAIN}.redirects.conf"
  # Recorded last: the commit now live, and the deploy no longer in flight.
  ssh "$PROD_HOST" "mkdir -p ~/deploy-state/prod && echo '${SHIP}' > ~/deploy-state/prod/${PROD_DOMAIN} && rm -f ~/deploy-state/prod/${PROD_DOMAIN}.inflight"
  echo "Rollback: ./deploy.sh rollback swaps the previous live site back in."
fi

echo "Deployment to ${ENV} complete!"
