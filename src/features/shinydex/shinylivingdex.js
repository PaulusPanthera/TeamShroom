// src/features/shinydex/shinylivingdex.js
// Shiny Living Dex — RENDER ONLY
// No DOM controls, no shared state, no side effects

import { renderUnifiedCard } from '../../ui/unifiedcard.js';
import { prettifyPokemonName } from '../../utils/utils.js';
import { buildShinyLivingDexModel } from '../../data/shinylivingdex.model.js';
import { POKEMON_SHOW } from '../../data/pokemondatabuilder.js';

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

  // ---------------------------------------------------------
  // DATA
  // ---------------------------------------------------------

  let dex = buildShinyLivingDexModel(showcaseRows).filter(
    e => POKEMON_SHOW[e.pokemon] !== false
  );

  if (search) {
    dex = dex.filter(e =>
      prettifyPokemonName(e.pokemon).toLowerCase().includes(search)
    );
  }

  if (unclaimedOnly) {
    dex = dex.filter(e => e.count === 0);
  }

  // ---------------------------------------------------------
  // SORTING
  // ---------------------------------------------------------

  if (sort === 'total') {
    dex.sort((a, b) => b.count - a.count);
  }
  // standard = already dex / region ordered by model

  countLabel.textContent = `${dex.length} Pokémon`;

  // ---------------------------------------------------------
  // GROUP BY REGION
  // ---------------------------------------------------------

  const byRegion = {};
  dex.forEach(e => {
    byRegion[e.region] ??= [];
    byRegion[e.region].push(e);
  });

  Object.entries(byRegion).forEach(([region, entries]) => {
    const section = document.createElement('section');
    section.className = 'region-section';

    const header = document.createElement('h2');
    header.textContent = region.toUpperCase();

    const grid = document.createElement('div');
    grid.className = 'dex-grid';

    entries.forEach(entry => {
      const shinyLabel =
        entry.count === 1
          ? '1 Shiny'
          : `${entry.count} Shinies`;

      grid.insertAdjacentHTML(
        'beforeend',
        renderUnifiedCard({
          name: prettifyPokemonName(entry.pokemon),
          img: getPokemonGif(entry.pokemon),
          info: shinyLabel,
          unclaimed: entry.count === 0,
          owners: entry.owners,
          cardType: 'pokemon'
        })
      );
    });

    section.append(header, grid);
    container.appendChild(section);
  });
}
