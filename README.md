# Team Shroom Shiny Dex Hitlist

This website tracks the Team Shroom PokeMMO team's shiny dex progress and shiny collections.  
Hosted on GitHub Pages.

---

## How to Update the Dex

- **Update member shinies:** Edit `teamshowcase.json` to add, update, or remove team member shinies and their data.
- **Update shiny Pokédex:** Edit `pokemon_families.json` to update Pokémon families, regions, rarity, and claimed status.
- **Update donations:** Edit `donations.json` to record or update donations for the Donators page.
- **Custom member avatars:** Place custom member avatars as `<membername>sprite.png` (or `.jpg`, `.gif`) in the `/membersprites/` folder. Fallback: `examplesprite.png` in the same folder.
- **Custom icons/symbols:** Place in `/symbols/` folder.

---

## How to Deploy

1. Commit and push your changes to the `main` branch.
2. Enable GitHub Pages in the repository settings (set source to `main` branch, root `/`).
3. Access your live site at `https://<username>.github.io/<repo>/`.

---

## Project Structure

- `index.html` — Main site page and routing logic.
- `/style/` — All CSS files (see below)
    - `base.css` — CSS variables, resets, base font.
    - `layout.css` — Layout, nav, containers, grid, responsive.
    - `cards.css` — Unified card styles for Pokémon/member cards.
    - `buttons.css` — Button, tab, and navigation link styles.
    - `search.css` — Search, filter, and form UI styles.
    - `tooltip.css` — Tooltip and popover styles.
    - `darkmode.css` — Dark mode overrides.
    - `donators.css` — Donator card/table styles.
- **JavaScript files:**
    - `pokemonDataBuilder.js` — Builds Pokémon families, points, tiers, and rarity from JSON.
    - `showcase.js` — Showcase logic, member shiny display, and shiny points scoreboard.
    - `shinydexsearch.js` — Hitlist search, filtering, and living dex logic.
    - `unifiedCard.js` — Card rendering for member and Pokémon display.
    - `donators.js` — Donator logic, tier assignment, and donation display.
- **Data files:**
    - `teamshowcase.json` — Main source for all team members and their shinies.
    - `pokemon_families.json` — Pokémon family and evolution group mapping, region, and rarity.
    - `donations.json` — List of donations and amounts for the Donators page.
- **Asset folders:**
    - `/membersprites/` — Member avatar sprites (custom images, PNG/JPG/GIF, plus `examplesprite.png` as fallback).
    - `/symbols/` — Icons for donator tiers, member statuses, and card overlays.

---

## CSS Usage

All CSS styles are split into modular files under the `/style/` folder.

**Include all of these in your `<head>` in this order:**
```html
<link rel="stylesheet" href="style/base.css">
<link rel="stylesheet" href="style/layout.css">
<link rel="stylesheet" href="style/cards.css">
<link rel="stylesheet" href="style/buttons.css">
<link rel="stylesheet" href="style/search.css">
<link rel="stylesheet" href="style/tooltip.css">
<link rel="stylesheet" href="style/darkmode.css">
<link rel="stylesheet" href="style/donators.css">
```

**Edit the relevant CSS file for the type of style you need to change:**
- General colors, variables, base font: `base.css`
- Layout, grid, nav, containers: `layout.css`
- Card appearance: `cards.css`
- Buttons, tabs, navigation links: `buttons.css`
- Search bar, dropdowns, forms: `search.css`
- Tooltip styles: `tooltip.css`
- Dark mode (overrides): `darkmode.css`
- Donator tables and boxes: `donators.css`

---

## Data & Asset Folders

- **/membersprites/**  
  Custom member avatars, named as `<membername>sprite.png` (or .jpg, .gif). Fallback avatar: `examplesprite.png` (must exist in this folder).

- **/symbols/**  
  Icons for donator tiers (e.g. `golddonatorsprite.png`), member statuses, and card overlays (e.g. `secretshinysprite.png`, `eventsprite.png`).

- **teamshowcase.json**  
  Main list of all team members and their shiny Pokémon (with status and custom data).

- **pokemon_families.json**  
  Pokémon families, region, rarity, and claimed member for each dex entry.

- **donations.json**  
  List of donations for the Donators leaderboard.

---

## To Do

- [ ] Add Socials (Twitch, Youtube) for Members
- [ ] Add alternative Shiny View with shinies roaming around
- [ ] Add Rarity Count to Living Dex
- [ ] Add Summary section to Shinies
- [ ] Badge Case
- [ ] Improve mobile and accessibility features

---

Inspired by Pokémon.  
Not affiliated with Nintendo, Game Freak, or PokeMMO.
