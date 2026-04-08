<!-- docs/css-loading-manifest.md -->
<!-- v2.0.0-beta -->
<!-- Current CSS loading order for the static entrypoint -->

# CSS Loading Manifest

This document describes the **current** stylesheet order loaded by `index.html`.

## Entry loading order

Stylesheets are linked statically and loaded in this order:

1. Google Font: `Press Start 2P`
2. `/style/base.css`
3. `style/layout.css`
4. `style/ts.shell.css`
5. `style/cards.css`
6. `/style/buttons.css`
7. `/style/search.css`
8. `/style/tooltip.css`
9. `/style/donators.css`
10. `/style/home.css`
11. `/style/shinyweekly.css`
12. `/style/shinywar.css`
13. `/style/showcase.css`
14. `/style/shinydex.css`

## Current rules

- CSS is loaded statically from `index.html`.
- Feature code does not dynamically inject stylesheets.
- Runtime code should continue to assume global CSS is already present.
- If stylesheet order changes in `index.html`, update this file in the same patch.

## Notes

- The current entry uses a mix of absolute (`/style/...`) and relative (`style/...`) hrefs.
- This file documents the current state; it does not prescribe a path-style migration by itself.
