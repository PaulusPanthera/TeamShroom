# TeamShroom

Static GitHub Pages website for the Team Shroom PokéMMO community.

The project is intentionally plain HTML/CSS/JS:
- no framework
- client-rendered
- hash-routed
- JSON-driven
- safe for GitHub Pages hosting

---

## Current site shape

### Main routes
- `#home`
- `#showcase`
- `#hitlist`
- `#hitlist/living`
- `#shinyweekly`
- `#shinywar`
- `#donators`

### Route alias
- `#pokedex` resolves to the same page family as `#hitlist`

### Navigation labels shown in the UI
- Home
- Shiny Showcase
- Shiny Pokédex
- Shiny Weekly
- Shiny War
- Donators

---

## Project structure

### Runtime
- `index.html` — static entrypoint
- `main.js` — boots route rendering
- `src/app/` — shell, routing, sidebar, cache
- `src/features/` — page-level feature entrypoints
- `src/domains/` — derived models / domain logic
- `src/data/` — runtime loaders and data shaping helpers
- `src/ui/` — shared UI render helpers
- `src/utils/` — general utilities
- `style/` — statically linked global/feature CSS
- `data/` — generated JSON consumed by the site

### Tooling / content pipeline
- `scripts/` — CSV fetch + normalize + JSON generation scripts
- `.github/workflows/` — scheduled data refresh automation
- `docs/` — repo documentation / maintenance notes

---

## Rendering model

### Shell
The app owns a persistent shell layer and swaps page content inside it.

Current shell responsibilities:
- header / plaque area
- navigation state
- left sidebar slots
- main content mount
- global shell-owned `COLLECT` button

### Sidebar
The current sidebar system is **controller-based**, not a pure JSON payload system.

Features receive a sidebar controller and can:
- set title text
- set hint text
- replace sidebar sections
- append sidebar sections

Sidebar sections are currently passed as labeled DOM nodes.

### Routes
Routing is hash-based and centralized in `src/app/routes.js`.

Important behavior:
- empty hash falls back to the Hitlist page
- `#pokedex` is treated as an alias for the Hitlist route family
- Pokedex subview state is canonicalized to `#hitlist` / `#hitlist/living`

---

## Data model

TeamShroom is data-driven.

### Source flow
Google Sheets / published CSVs are transformed by `scripts/*.mjs` into JSON files under `data/`.

### Runtime loading
Most runtime datasets use a shared JSON envelope with:
- `version`
- `generatedAt`
- `source`
- `data`

The Shiny War config is handled separately by its loader because it is treated as config-shaped data rather than a standard row list.

---

## Current feature overview

### Home
Guild landing page / overview.

### Shiny Showcase
Member-focused showcase and profile-style browsing.

### Shiny Pokédex
Hitlist + Living Dex view family.

### Shiny Weekly
Weekly shiny history / week detail browsing.

### Shiny War
War/event board derived from Weekly data plus Shiny War config.

### Donators
Supporter / donations view.

---

## Practical repo rules

- Prefer small safe patches over rewrites.
- Keep GitHub Pages compatibility.
- Keep CSS statically linked through `index.html`.
- Treat generated JSON in `data/` as runtime input, not hand-maintained source.
- Update docs when route behavior, sidebar wiring, or CSS loading order changes.
