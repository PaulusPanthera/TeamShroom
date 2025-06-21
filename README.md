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
- `style.css` — Styling for the site.
- `shinydex.js` — Full shiny Pokédex data and claims.
- `teamshowcase.js` — Shiny lists per team member.
- `showcase.js` — Showcase logic and shiny points display.
- `pokemonFamilies.js` — Pokémon family and evolution group mapping.
- `pokemonPoints.js` — Shiny point values by tier and family.
- `shinydexsearch.js` — Hitlist search, filtering, and living dex logic.
- `unifiedCard.js` — Card rendering for member and Pokémon display.

---

## To Do

- [ ] Add Donator Symbols
- [ ] Add Socials (Twitch, Youtube) for Members
- [ ] Add alternative Shiny View with shinies roaming around
- [ ] Add Rarity Count to Living Dex
- [ ] Add Summary section to Shinies
- [ ] Improve mobile and accessibility features

---

Inspired by Pokémon.  
Not affiliated with Nintendo, Game Freak, or PokeMMO.
