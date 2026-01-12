// src/features/shinydex/shinylivingdex.js
// Shiny Living Dex — species ownership view
// Render-only. Stateless. Controller owns UI & state.

import { renderUnifiedCard } from '../../ui/unifiedcard.js';
import { prettifyPokemonName } from '../../utils/utils.js';
import {
  POKEMON_SHOW,
  POKEMON_REGION,
  POKEMON_POINTS
} from '../../data/pokemondatabuilder.js';
import {
  buildShinyLivingDexModel
} from '../../domains/shinydex/livingdex.model.js';

function getPokemonGif(key) {
  return `https://img.pokemondb.net/sprites/black-white/anim/shiny/${key}.gif`;
}

export function renderShinyLivingDex({
  showcaseRows,
  search,
  unclaimedOnly,
  sort,
  countLabel
}) {
  const container = document.getElementById('shiny-dex-container');
  container.innerHTML = '';

  // --------------------------------------------------
  // DATA
  // --------------------------------------------------

  const dex = buildShinyLivingDexModel(showcaseRows)
    .filter(e => POKEMON_SHOW[e.pokemon] !== false);

  let list = dex;

  if (search) {
    list = list.filter(e =>
      prettifyPokemonName(e.pokemon).toLowerCase().includes(search)
    );
  }

  if (unclaimedOnly) {
    list = list.filter(e => e.count === 0);
  }

  // --------------------------------------------------
  // SORT
  // --------------------------------------------------

  if (sort === 'total') {
    list = [...list].sort((a, b) => b.count - a.count);
  } else {
    // Stable Pokédex order via POKEMON_POINTS key order
    const order = Object.keys(POKEMON_POINTS);
    list = [...list].sort(
      (a, b) => order.indexOf(a.pokemon) - order.indexOf(b.pokemon)
    );
  }

  // --------------------------------------------------
  // GROUP BY REGION
  // --------------------------------------------------

  const byRegion = {};
  list.forEach(e => {
    const region = POKEMON_REGION[e.pokemon] || 'unknown';
    byRegion[region] ??= [];
    byRegion[region].push(e);
  });

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

  let totalSpecies = 0;
  let ownedSpecies = 0;

  Object.entries(byRegion).forEach(([region, entries]) => {
    const section = document.createElement('section');
    section.className = 'region-section';

    const total = entries.length;
    const owned = entries.filter(e => e.count > 0).length;

    totalSpecies += total;
    ownedSpecies += owned;

    const header = document.createElement('h2');
    header.textContent =
      `${region.toUpperCase()} (${owned} / ${total})`;

    const grid = document.createElement('div');
    grid.className = 'dex-grid';

    entries.forEach(entry => {
      const info =
        entry.count === 0
          ? 'Unowned'
          : entry.count === 1
            ? '1 Shiny'
            : `${entry.count} Shinies`;

      grid.insertAdjacentHTML(
        'beforeend',
        renderUnifiedCard({
          name: prettifyPokemonName(entry.pokemon),
          img: getPokemonGif(entry.pokemon),
          info,
          unclaimed: entry.count === 0,
          highlighted: entry.count > 0,
          cardType: 'pokemon'
        })
      );
    });

    section.append(header, grid);
    container.appendChild(section);
  });

  countLabel.textContent =
    `${ownedSpecies} / ${totalSpecies} Species`;
}
