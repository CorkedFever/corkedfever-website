# corkedfever.com

The portfolio page for CorkedFever's hobby projects. One static page, no dependencies.

## Adding or changing a project

1. Edit [projects.json](projects.json). Each project has:
   - `status`: `live` (Now Showing), `production` (In Production) or `planned` (Coming Soon)
   - `stage`: optional, e.g. `alpha` or `beta`. Shown beside the status badge.
   - `accent`: the card's colour as `#RRGGBB`. It also gets a bar in the hero's test card.
   - `built`: optional short engineering notes, the part a hiring manager reads
   - `links`: optional buttons. Leave empty until the repository is public.
2. Run `node build.mjs`.
3. Commit `projects.json` and `docs/index.html` together and push.

Channel numbers follow the order in the file. Page copy, styles and the About section live in
[template.html](template.html). Never edit `docs/index.html` by hand; the build overwrites it.

## Hosting

Same pattern as Aetherstream: GitHub Pages serves `docs/` from `main`, and Caddy on meteor proxies
`corkedfever.com` to it, so a push updates the site. The site block to add to meteor's Caddyfile is
in [deploy/Caddyfile.snippet](deploy/Caddyfile.snippet).
