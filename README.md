# Team Shroom Shiny Dex Hitlist

This website tracks the Team Shroom PokeMMO team's shiny dex progress and shiny collections.  
Hosted on GitHub Pages.

---

## How to Update the Dex

- Edit `shinydex.js` to add or remove Pokémon and update their claimed/caught status.
- To add, update, or remove team member shinies, edit `teamshowcase.js`.

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
- `shinydex.js` — Full shiny Pokédex data and claims.
- `teamshowcase.js` — Shiny lists per team member.
- `showcase.js` — Showcase logic and shiny points display.
- `pokemonFamilies.js` — Pokémon family and evolution group mapping.
- `pokemonPoints.js` — Shiny point values by tier and family.
- `shinydexsearch.js` — Hitlist search, filtering, and living dex logic.
- `unifiedCard.js` — Card rendering for member and Pokémon display.

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
```

**Edit the relevant CSS file for the type of style you need to change:**
- General colors, variables, base font: `base.css`
- Layout, grid, nav, containers: `layout.css`
- Card appearance: `cards.css`
- Buttons, tabs, navigation links: `buttons.css`
- Search bar, dropdowns, forms: `search.css`
- Tooltip styles: `tooltip.css`
- Dark mode (overrides): `darkmode.css`

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
