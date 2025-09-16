# Team Shroom Shiny Dex Hitlist

This website tracks Team Shroom's PokeMMO shiny dex progress and shiny collections.  
Hosted on GitHub Pages.

---

## How to Update the Dex

- **Update member shinies:** Edit `/data/teamshowcase.json` to add, update, or remove team member shinies and their data.
- **Update shiny Pokédex:** Edit `/data/pokemonfamilies.json` to update Pokémon families, regions, rarity, and claimed status.
- **Update donations:** Edit `/data/donations.json` to record or update donations for the Donators page.
- **Custom member avatars:** Place custom member avatars as `<membername>sprite.png` (or `.jpg`, `.gif`) in `/img/membersprites/`. Fallback: `examplesprite.png` must also be in that folder.
- **Custom icons/symbols:** Place in `/img/symbols/`.

---

## How to Deploy

1. Commit and push your changes to the `main` branch.
2. Enable GitHub Pages in the repository settings (set source to `main` branch, root `/`).
3. Access your live site at `https://<username>.github.io/<repo>/`.

---

## Project Structure

- `index.html` — Main site page and routing logic.
- `/style/` — All CSS files (see below)
    - `base.css`, `layout.css`, `cards.css`, `buttons.css`, `search.css`, `tooltip.css`, `darkmode.css`, `donators.css`
- **JavaScript files:** (now using modern ES modules)
    - `main.js` — Entry point. Handles all routing, data loading, and page rendering. No inline JS in HTML.
    - `utils.js` — Centralized helpers for normalization, prettification, and other utilities.
    - `pokemondatabuilder.js` — Builds Pokémon families, points, tiers, and rarity from JSON.
    - `showcase.js` — Showcase logic, member shiny display, and shiny points scoreboard.
    - `shinydexsearch.js` — Hitlist search, filtering, and living dex logic.
    - `unifiedcard.js` — Card rendering for member and Pokémon display.
    - `donators.js` — Donator logic, tier assignment, and donation display.
- **Data files:** (in `/data/`)
    - `teamshowcase.json`
    - `pokemonfamilies.json`
    - `donations.json`
- **Asset folders:** (under `/img/`)
    - `/img/membersprites/` — Member avatar sprites (PNG/JPG/GIF, plus `examplesprite.png` as fallback).
    - `/img/symbols/` — Icons for donator tiers, member statuses, and card overlays.

---

## ES Modules Architecture

- All JavaScript files now use [ES module syntax](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules):
  - Use `import` and `export` instead of attaching to `window` or using global variables.
  - All dependencies are declared explicitly at the top of each file.
  - The entrypoint (`main.js`) is loaded in `index.html` as a module:  
    `<script type="module" src="main.js"></script>`
- **No inline JS in HTML.**  
  All page logic (including dark mode, navigation, and initialization) is contained in `main.js`.

---

## Data & Asset Folders

- **/img/membersprites/**  
  Custom member avatars, named as `<membername>sprite.png` (or .jpg, .gif). Fallback: `examplesprite.png` here.

- **/img/symbols/**  
  Icons for donator tiers (e.g. `golddonatorsprite.png`), member statuses, and card overlays.

- **/data/teamshowcase.json**  
  Main list of all team members and their shiny Pokémon (with status and custom data).

- **/data/pokemonfamilies.json**  
  Pokémon families, region, rarity, and claimed member for each dex entry.

- **/data/donations.json**  
  List of donations for the Donators leaderboard.

---

## To Do

- [ ] Add Socials (Twitch, Youtube) for Members
- [ ] Gastrodon fixen
- [ ] Points Nincada Line fixen
- [ ] Sawsbuck Line fixen
- [ ] Add alternative Shiny View with shinies roaming around
- [ ] Add Rarity Count to Living Dex
- [ ] Add Summary section to Shinies
- [ ] Badge Case
- [ ] Improve mobile and accessibility features
- [ ] Switch to React framework
- [ ] json -> google doc so everyone can edit it
---

Inspired by Pokémon.  
Not affiliated with Nintendo, Game Freak, or PokeMMO.
