<!-- docs/SMOKE_TESTS.md -->
<!-- v2.0.0-beta -->
<!-- Minimal manual smoke tests for route stability and core UI expectations -->

# Smoke Tests

Run this checklist after changes to routing, shell, sidebar wiring, UnifiedCard rendering, or CSS.

## Global
- Load the site with no hash: it should default to `/#hitlist`.
- Navigate between routes quickly: `/#hitlist` -> `/#showcase` -> `/#shinyweekly` -> `/#donators`.
  - Previous content must clear.
  - Sidebar sections must update per route (no leftover controls).
- COLLECT button is always visible in the header shell.
  - No duplicate COLLECT buttons.
  - Clicking COLLECT does not change layout positioning.

## /#hitlist (Pokedex)
- Tabs exist: **Shiny Dex Hitlist**, **Shiny Living Dex**.
- Cards render with tier borders and variant buttons.
- Search input filters cards.
- Unclaimed toggle filters deterministically.
- Sort select switches modes without breaking rendering.
- Switching tabs preserves stable route behavior (no broken mount).

## /#showcase
- Gallery loads and shows member cards.
- Gallery sidebar controls render (search + sort + totals).
- Selecting a member route via click opens member view.
  - Back button returns to gallery.
- Member view shows cards with variant buttons (standard/secret/alpha/safari where applicable).
- Clicking a card with a clip opens a new tab.

## /#shinyweekly
- Loading state appears, then latest week is selected by default.
- If there are no weeks, empty state renders (not blank).
- Changing week does not wipe the main panel.
- When no member selected, main panel shows the prompt state.
- Selecting a member renders deterministic shiny list for that week.

## /#donators
- Loading state appears, then list renders.
- Error state renders if fetch fails.
- Sidebar renders totals section (no empty sidebar).
