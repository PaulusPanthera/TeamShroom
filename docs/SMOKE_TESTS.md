<!-- docs/SMOKE_TESTS.md -->
<!-- v2.0.0-beta -->
<!-- Minimal manual smoke tests for route stability and core shell expectations -->

# Smoke Tests

Run this checklist after changes to routing, shell wiring, sidebar behavior, CSS loading, or shared card rendering.

## Global
- Load the site with no hash.
  - It should render the Hitlist page.
  - The URL hash may remain empty; fallback is route-level, not a forced hash rewrite.
- Navigate quickly between:
  - `/#home`
  - `/#showcase`
  - `/#hitlist`
  - `/#hitlist/living`
  - `/#shinyweekly`
  - `/#shinywar`
  - `/#donators`
- Confirm previous content clears before the new route settles.
- Confirm sidebar title / hint / controls update per route with no leftover sections.
- Confirm there is only one shell-owned `COLLECT` button.

## /#hitlist and aliases
- `/#hitlist` renders the Shiny Pokédex page.
- `/#pokedex` resolves to the same page family.
- `/#hitlist/living` opens the Living Dex subview.
- Tab switching between Hitlist and Living keeps the page mounted and updates the hash canonically.
- Search, filters, and sort controls do not break card rendering.

## /#showcase
- Gallery view loads.
- Sidebar controls render.
- Opening a member-specific route works.
- Returning from a member-specific route restores the gallery cleanly.
- Clip links still open normally.

## /#shinyweekly
- Loading state appears first.
- Latest week is selected by default when data exists.
- Empty state renders when no weeks exist.
- Changing week keeps the main panel stable.
- Selecting a member renders deterministic week detail.

## /#shinywar
- Loading state appears first.
- War board renders without Weekly route artifacts leaking into the view.
- Sidebar controls render and update the board.
- Reset view returns the board to its default control state.

## /#donators
- Loading state appears first.
- Error state renders if fetch fails.
- Sidebar shows route-specific content rather than an empty shell.
