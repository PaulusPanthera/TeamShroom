# Repo structure

This document describes the current TeamShroom repo layout as it exists today.

## Runtime app

These folders/files are part of the static site itself.

- `index.html` — app shell entry
- `main.js` — boot entry
- `src/app/` — shell, routing, render lifecycle
- `src/features/` — page/feature modules
- `src/domains/` — domain models and transforms
- `src/data/` — runtime loaders and data builders used by features
- `src/ui/` — shared UI helpers/components
- `src/utils/` — shared utility helpers
- `style/` — global and feature CSS loaded by the app shell
- `data/` — generated JSON consumed by the site
- `img/` — runtime images, sprites, fonts, and symbols used by the site

## Repo tooling

These folders support data generation and repo checks.

- `scripts/` — sheet ingestion, normalization, contracts, and repo checks
- `.github/workflows/` — automation for JSON generation and related tasks

## Repo-only documentation and reference material

These are for maintenance only and are not part of the runtime site.

- `docs/` — maintenance notes, smoke checks, CSS/loading docs
- `docs/reference/` — reference screenshots and other non-runtime materials
- `VERSIONING.md` — repo conventions/version notes

## Boundary rule used by the checker

`scripts/check-feature-boundaries.mjs` reflects the current lightweight architecture:

- features may import from `src/domains/`, `src/ui/`, `src/app/`, `src/data/`, and `src/utils/`
- cross-feature imports are blocked by default
- the current `pokedex` to `shinydex` adapter bridge is explicitly allowed

This matches the current repo and avoids forcing a larger refactor just to satisfy the checker.
