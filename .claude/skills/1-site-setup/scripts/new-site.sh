#!/bin/bash
# Bootstrap a new client site from the restaurant template.
# Usage: ./new-site.sh <site_name>   (lowercase, hyphens/underscores, no spaces)
# Creates ../<site_name> as a sibling of the template repo, git-inits it,
# stamps SITE_NAME into deploy.sh/package.json, and installs dependencies.
set -euo pipefail

SITE_NAME="${1:-}"
if [[ -z "$SITE_NAME" || ! "$SITE_NAME" =~ ^[a-z0-9][a-z0-9_-]*$ ]]; then
  echo "Usage: new-site.sh <site_name>  (lowercase letters/digits/-/_)"
  exit 1
fi

# Resolve the template root (this script lives in .claude/skills/1-site-setup/scripts/)
TEMPLATE_ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
DEST="$(dirname "$TEMPLATE_ROOT")/${SITE_NAME}"

if [[ -e "$DEST" ]]; then
  echo "❌ $DEST already exists — aborting."
  exit 1
fi

# Refuse to clone a dirty template — the new site should start from a known state.
if [[ -n "$(git -C "$TEMPLATE_ROOT" status --porcelain)" ]]; then
  echo "❌ Template checkout at $TEMPLATE_ROOT has uncommitted changes — commit or stash first."
  exit 1
fi

echo "Creating ${DEST} from ${TEMPLATE_ROOT}..."
rsync -a \
  --exclude .git \
  --exclude node_modules \
  --exclude dist \
  --exclude .playwright-mcp \
  --exclude extraction \
  --exclude photo-originals \
  --exclude /scripts/upgrade \
  --exclude /scripts/test \
  --exclude /scripts/golive \
  --exclude /scripts/server \
  --exclude /server \
  --exclude /.claude/skills/upgrade-client-site \
  --exclude /.claude/skills/go-live \
  --exclude /template.json \
  "$TEMPLATE_ROOT/" "$DEST/"

cd "$DEST"

# Fleet/ops tooling (scripts/upgrade, scripts/golive, scripts/server, server/,
# the upgrade and go-live skills, template.json) is excluded above on
# purpose: it always runs FROM the template AGAINST a client path, so a copy
# inside a client repo would go stale the moment the template's own tool
# changes and could be run there by mistake. See CLAUDE.md's
# "Going-forward rule".

# Record what this site was bootstrapped from, so a future sync/upgrade run
# can find its base without guessing. `base` and `sha` start identical — this
# IS the base, day one.
TEMPLATE_SHA="$(git -C "$TEMPLATE_ROOT" rev-parse HEAD)"
SYNCED_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
cat > template.lock <<EOF
{
  "template": "restaurant-template",
  "sha": "${TEMPLATE_SHA}",
  "syncedAt": "${SYNCED_AT}",
  "base": "${TEMPLATE_SHA}",
  "migrations": []
}
EOF

# Edit in place without `sed -i`, whose syntax differs between BSD (macOS wants
# `-i ''`) and GNU (Linux rejects it). The template is cloned onto whatever
# machine a colleague runs, so the portable form is the only safe one.
#
# `mv` carries the temp file's permissions, not the target's, and mktemp
# creates at 0600 — so stamping deploy.sh silently stripped its executable
# bit and every new client repo failed its first `./deploy.sh preview` with
# "permission denied". Copy the original's mode across before replacing it.
stamp() {
  local file="$1" expr="$2" tmp
  tmp="$(mktemp)"
  sed "$expr" "$file" > "$tmp" || return 1
  chmod --reference="$file" "$tmp" 2>/dev/null || chmod "$(stat -f '%Lp' "$file" 2>/dev/null || echo 644)" "$tmp"
  mv "$tmp" "$file"
}

# Stamp the site name into the deploy + preview-build config.
stamp deploy.sh    "s/^SITE_NAME=.*/SITE_NAME=\"${SITE_NAME}\"/"
stamp package.json "s|PATH_PREFIX:-/custom_template/|PATH_PREFIX:-/${SITE_NAME}/|"

git init -q
# Name the first branch explicitly. `git init` otherwise follows the machine's
# init.defaultBranch, which is still `master` on any install that never set it
# — so a client repo lands on a different default branch from the template and
# from GitHub's, and the mismatch only surfaces after the repo is pushed.
# `symbolic-ref` rather than `git init -b main`: the latter needs git 2.28+ and
# this script is cloned onto whatever a colleague happens to be running. Safe
# here because HEAD is still unborn.
git symbolic-ref HEAD refs/heads/main
git add -A
git commit -q -m "Bootstrap ${SITE_NAME} from restaurant-template"

# Create the client's own repo under the same GitHub org as the template and
# push. Private by default — a client site is not public work until they say
# so. Set GH_ORG to target a different org, NO_REMOTE=1 to stay local-only.
# Every failure here is a warning, not an abort: the site still builds and
# deploys from the local checkout, and the repo can be created afterwards.
if [[ "${NO_REMOTE:-}" == "1" ]]; then
  echo "↷ NO_REMOTE=1 — skipping GitHub repo creation."
elif ! command -v gh >/dev/null 2>&1; then
  echo "⚠️  gh not installed — no GitHub repo created. Local repo is fine."
elif ! gh auth status >/dev/null 2>&1; then
  echo "⚠️  gh not authenticated (\`gh auth login\`) — no GitHub repo created."
else
  # Default to the org the template itself lives in, so client sites land
  # beside it rather than under a personal account.
  #
  # Ask GitHub rather than parsing the remote URL. An org rename keeps every
  # old URL working through a redirect, so the remote can name an org that no
  # longer resolves — `gh repo create` against that stale name fails and the
  # client silently ends up without a repo. `gh repo view` reports where the
  # repo actually lives today. The URL parse stays as the offline fallback.
  ORG="${GH_ORG:-}"
  if [[ -z "$ORG" ]]; then
    ORG="$(gh repo view "$(git -C "$TEMPLATE_ROOT" remote get-url origin 2>/dev/null)" \
      --json nameWithOwner -q '.nameWithOwner' 2>/dev/null | cut -d/ -f1)"
  fi
  if [[ -z "$ORG" ]]; then
    ORG="$(git -C "$TEMPLATE_ROOT" remote get-url origin 2>/dev/null |
      sed -E 's#^(git@[^:]+:|https://[^/]+/)([^/]+)/.*#\2#')"
  fi
  if [[ -z "$ORG" ]]; then
    echo "⚠️  Could not derive the GitHub org from the template remote — set GH_ORG."
  elif gh repo view "${ORG}/${SITE_NAME}" >/dev/null 2>&1; then
    echo "⚠️  ${ORG}/${SITE_NAME} already exists — leaving it alone."
  elif gh repo create "${ORG}/${SITE_NAME}" --private --source=. --remote=origin --push >/dev/null 2>&1; then
    echo "✅ Pushed to https://github.com/${ORG}/${SITE_NAME} (private)."
  else
    echo "⚠️  Could not create ${ORG}/${SITE_NAME} (permissions?) — local repo is fine."
  fi
fi

echo "Installing dependencies..."
npm install --silent

echo "✅ ${DEST} ready. Next: BUILD.md, then extraction (1-site-setup)."
