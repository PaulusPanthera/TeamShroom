<!-- docs/css-loading-manifest.md -->
<!-- v2.0.0-beta -->
<!-- Authoritative manifest for CSS loading order, ownership, and forbidden patterns -->

# CSS Loading Manifest

## Global Stylesheets (loaded by `index.html`)

Order is strict and must not change.

1. Google Font: Press Start 2P
2. `/style/base.css`
3. `/style/layout.css`
4. `/style/ts.shell.css`
5. `/style/cards.css`
6. `/style/buttons.css`
7. `/style/search.css`
8. `/style/tooltip.css`
9. `/style/donators.css`
10. `/style/shinyweekly.css`
11. `/style/showcase.css`
12. `/style/shinydex.css`

No other global stylesheets are permitted.

## Feature Stylesheets

All feature CSS is statically linked via `index.html`.

- Donators: `donators.css`
- Shiny Weekly: `shinyweekly.css`
- Showcase: `showcase.css`
- ShinyDex / Cards / Variants: `cards.css`, `shinydex.css`

No feature may dynamically load or inject CSS.

## Ownership Rules

### `#page-content`

Primary owner: `/style/ts.shell.css` (shell-active only)

`#page-content` layout rules are conditionally owned by the TS shell when `#ts-shell` is present.
Legacy global styles must not assume ownership.

No other stylesheet may define layout, sizing, or positioning rules for `#page-content`.

### Cards Pop CSS

Owner: `/style/cards.css`

Loaded exactly once via `index.html`.
No duplication, reinjection, or JS-assisted loading is allowed.

## Explicitly Forbidden Patterns

- Injecting `<style>` tags via JavaScript
- Injecting `<link rel="stylesheet">` via JavaScript
- Loading global CSS from feature code
- Duplicated stylesheet `href` values
- Conditional or runtime CSS loading

Violations of this manifest are considered architectural regressions.
