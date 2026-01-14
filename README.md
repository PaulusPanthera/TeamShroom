# Team Shroom Shiny System (Static Site)

Static website for tracking Team Shroom’s PokeMMO shinies:
- Shiny Pokédex (Hitlist + Living Dex)
- Shiny Showcase (member gallery + per-member collections)
- Donators
- Shiny Weekly (data supported; page currently disabled in routing)

The site is fully static (GitHub Pages + custom domain). Data is maintained in Google Sheets and compiled into JSON via GitHub Actions.

---

## Live Site

https://www.teamshroom.com

---

## Pages

### Shiny Pokédex
Routes:
- `#hitlist`
- `#pokedex`

Core behavior:
- Unified collector-card UI for all Pokémon entries
- Variant switching per card: Standard / Secret / Alpha / Safari
- Points + tier trims derived from Pokémon tiers
- Search and filtering logic lives in feature code, not the renderer

Relevant code:
- `src/features/pokedex/*`
- `src/features/shinydex/*`
- `src/ui/unifiedcard.js`

### Shiny Showcase
Route:
- `#showcase`

Gallery behavior:
- Member cards rendered through UnifiedCard (member mode)
- Search member name
- Sort: alphabetical / total shinies / total points

Member profile behavior:
- Displays all shinies for the member, grouped by status:
  - Active
  - Sold
  - Lost
- Filters:
  - Search Pokémon name
  - Sort: newest / dex order / A–Z / points
  - Status: Active Only / All / Lost-Sold Only
  - Variant: Any / Standard / Secret / Alpha / Safari
- Clips:
  - If a shiny has a `clip` field, clicking its card opens the URL in a new tab

Counting rules:
- Active count and points ignore `lost` and `sold`
- Lost/Sold remain visible but are treated as inactive

Relevant code:
- `src/features/showcase/*`
- `src/domains/showcase/showcase.model.js`

### Donators
Route:
- `#donators`

Behavior:
- Tiered supporter display driven by generated JSON

Relevant code:
- `src/features/donators/*`
- `src/domains/donators/*`

### Shiny Weekly
Route:
- `#shinyweekly`

Status:
- Data pipeline generates `data/shinyweekly.json`
- UI code exists
- Routing currently redirects `#shinyweekly` to `#hitlist` to avoid broken production UI

Relevant code:
- `src/features/shinyweekly/*`
- `data/shinyweekly.json`

---

## Data Flow

Source of truth:
- Google Sheets (edited collaboratively)

Pipeline:
1. Google Sheets are published as CSV
2. GitHub Actions fetches CSV from repository secrets
3. Node scripts validate, normalize, and write JSON
4. Generated `data/*.json` is committed back to the repo
5. GitHub Pages serves the static site

Workflow:
- `.github/workflows/sheets-to-json.yml`
- Runs on schedule (every 6 hours) and via manual dispatch

---

## Generated Data (Do Not Edit)

Generated files says what the site consumes at runtime:
- `data/pokemon.json`
- `data/members.json`
- `data/shinyshowcase.json`
- `data/shinyweekly.json`
- `data/donators.json`

Manual edits to these files get overwritten by CI.

---

## Sheets Contracts and Validation

All CSV rows are validated against contracts before JSON output:
- `scripts/contracts/*.contract.mjs`

Contracts define required fields and types. Example highlights:

### Shiny Showcase fields
Required:
- `ot`
- `pokemon`

Optional:
- `method`, `encounter`
- `secret`, `alpha`, `run`, `favorite`
- `lost`, `sold`
- `clip`, `notes`

### Members fields
Required:
- `name`
- `role` (`spore`, `shroom`, `shinyshroom`, `mushcap`)

Optional:
- `active`
- `sprite` (`png`, `gif`, `jpg`, `none`, `""`)

Member sprite path rule:
- `img/membersprites/${memberKey}sprite.${member.sprite}`

If sprite is missing or `none`, the UI uses the fallback example sprite.

### Pokémon fields
Required:
- `dex`
- `pokemon`
- `tier`

Optional:
- `family`, `region`, `rarity`, `show`

---

## Sprite Handling (PokéDB)

Pokémon shiny sprites come from PokéDB animated BW shiny GIFs.

Central mapping exists to prevent per-feature override maps:
- `src/utils/utils.js`
  - `toPokemonDbSpriteKey()`
  - `getPokemonDbShinyGifSrc()`

This normalizes edge keys like:
- `mrmime` → `mr-mime`
- `mimejr` → `mime-jr`
- `typenull` → `type-null`
- `porygonz` → `porygon-z`

---

## Local Development

No build step. ES Modules only.

Run any static server in the repo root:
- `python -m http.server`
- `npx serve`
- any equivalent

Opening `index.html` via `file://` will fail due to module imports.

---

## Codebase Rules

- ES Modules only (`import` / `export`)
- No bundler
- No global mutable state
- Feature-owned semantics, shared renderer
- UnifiedCard (`src/ui/unifiedcard.js`) stays render-only and dumb
- Feature modules own:
  - filtering, sorting, grouping
  - active/inactive rules
  - variant enablement and default selection
- CSS must avoid global bleed; page-level styles are scoped under page roots

File headers for touched files:
```js

// <file-path/name>
// v2.0.0-beta
// <description + comments> 

```

## Project Structure

Top-level:

-index.html — static shell + CSS includes
-main.js — routing + data bootstrapping
-data/*.json — CI output
-scripts/*.mjs — CSV fetch + validation + JSON generation
-style/*.css — global + feature-level styles

Source:

-src/data/ — JSON loaders + data models
-src/domains/ — derived data builders per domain
-src/features/ — page logic (presenters + UI renderers)
-src/ui/ — shared UI components
-src/utils/ — shared utilities


### Disclaimer

Unofficial fan project. Not affiliated with Nintendo, Game Freak, or PokeMMO.
