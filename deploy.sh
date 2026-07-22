#!/bin/bash
set -e

# Site folder name on the servers. Edit this once per client.
SITE_NAME="pd-thai-upgrade"

PROD_DEST="deploy@88restaurants.com:/home/deploy/eight_eight/current/public/sites/${SITE_NAME}"
PREVIEW_DEST="rg@104.237.128.61:/var/www/preview.88restaurants.com/_site/${SITE_NAME}/"

echo "Where do you want to deploy?"
echo "  1) Production"
echo "  2) Preview"
read -rp "Enter choice [1-2]: " choice

case "$choice" in
  1)
    TARGET="$PROD_DEST"
    ENV="production"
    read -rp "⚠️  This deploys to the LIVE site. Continue? [y/N]: " confirm
    [[ "$confirm" =~ ^[Yy]$ ]] || { echo "Aborted."; exit 1; }
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

echo "Deploying to ${ENV}..."
rsync -avz --delete dist/ "$TARGET"

echo "Deployment to ${ENV} complete!"
