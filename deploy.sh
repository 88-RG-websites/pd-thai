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

# Non-interactive mode: `./deploy.sh preview` skips the prompt (used by
# automation). Production is HUMAN-ONLY: it requires an interactive terminal
# and a typed confirmation — automation/agents must never deploy to the live
# site, and there is deliberately no flag that bypasses this.
MODE="${1:-}"

if [[ "$MODE" == "preview" ]]; then
  choice=2
elif [[ "$MODE" == "production" ]]; then
  choice=1
elif [[ -n "$MODE" ]]; then
  echo "Usage: ./deploy.sh [preview|production]"
  exit 1
else
  echo "Where do you want to deploy?"
  echo "  1) Production"
  echo "  2) Preview"
  read -rp "Enter choice [1-2]: " choice
fi

case "$choice" in
  1)
    if [[ -z "$PROD_DOMAIN" ]]; then
      echo "❌ PROD_DOMAIN is empty — set it to the live domain at the top of this script."
      echo "   Production is /var/www/<domain>/_site on rg@104.237.128.61."
      exit 1
    fi
    TARGET="$PROD_DEST"
    ENV="production"
    if [[ ! -t 0 ]]; then
      echo "❌ Production deploys require an interactive terminal (a human)."
      echo "   Automation may only run: ./deploy.sh preview"
      exit 1
    fi
    # Confirm against the domain, not the slug: the domain is what gets
    # overwritten, and --delete has no undo.
    read -rp "⚠️  This deploys to the LIVE site. Type the domain (${PROD_DOMAIN}) to continue: " confirm
    [[ "$confirm" == "$PROD_DOMAIN" ]] || { echo "Aborted — name did not match."; exit 1; }
    ;;
  2)
    TARGET="$PREVIEW_DEST"
    ENV="preview"
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
rsync -rltzvO --delete --filter='P /_versions/**' dist/ "$TARGET"

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
fi

echo "Deployment to ${ENV} complete!"
