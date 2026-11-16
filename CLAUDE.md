# pd-thai: client site built from restaurant-template

The rules every client site shares (template mechanics, deploy and merge policy, design-review
lessons) are in `~/.claude/context/client-site.md`. A SessionStart hook injects it in a session
opened in this repo. If it is not in your context (a session opened from a parent folder, or a
subagent), read that file before editing here. This file holds only what is specific to this site.

## This site
- Preview: `https://preview.88restaurants.com/pd-thai/`. Production domain: `pdthaiaustin.com` (`deploy.sh` `PROD_DOMAIN`).
- `deploy.sh` has the guarded `--confirm` production path (rules in the shared file).
- Content, the 88restaurants id, hours and menus: `src/_data/client.js`. Look: `src/_data/theme.js` and `src/assets/sass/styles.scss`.
- Template: last synced to restaurant-template `f34b19ef` (2026-10-06); migrations applied: 010, 020, 030, 050, 060, 070, 080. `template.lock` is the record.
- 13 template files were kept as this site's own on that sync (`template.lock` `skipped`). Read the file before assuming the template's version.
