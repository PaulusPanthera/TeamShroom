// src/features/shinydex/shinylivingdex.js
// Shiny Dex — LIVING DEX VIEW

import { renderUnifiedCard } from '../../ui/unifiedcard.js';
import { prettifyPokemonName } from '../../utils/utils.js';
import {
  POKEMON_SHOW,
  POKEMON_REGION
} from '../../data/pokemondatabuilder.js';

function getPokemonGif(pokemonKey) {
  return `https://img.pokemondb.net/sprites/black-white/anim/shiny/${pokemonKey}.gif`;
}

export function renderShinyLivingDex({
  showcaseRows,
  search = '',
  container,
  totalCounter
}) {
  container.innerHTML = '';

  const counts = {};

  showcaseRows.forEach(row => {
    if (row.lost || row.sold) return;
    if (POKEMON_SHOW[row.pokemon] === false) return;

    counts[row.pokemon] ??= 0;
    counts[row.pokemon]++;
  });

  let entries = Object.keys(counts).map(pokemon => ({
    pokemon,
    count: counts[pokemon]
  }));

  entries.sort((a, b) =>
    a.pokemon.localeCompare(b.pokemon)
  );

  if (search) {
    entries = entries.filter(e =>
      prettifyPokemonName(e.pokemon)
        .toLowerCase()
        .includes(search)
    );
  }

  totalCounter.textContent = `${entries.length} Pokémon`;

  const byRegion = {};

  entries.forEach(e => {
    const region =
      (POKEMON_REGION[e.pokemon] || 'unknown').toUpperCase();
    byRegion[region] ??= [];
    byRegion[region].push(e);
  });

  Object.entries(byRegion).forEach(([region, list]) => {
    const section = document.createElement('section');
    section.className = 'region-section';

    const header = document.createElement('h2');
    header.textContent = region;

    const grid = document.createElement('div');
    grid.className = 'dex-grid';

    list.forEach(entry => {
      grid.insertAdjacentHTML(
        'beforeend',
        renderUnifiedCard({
          name: prettifyPokemonName(entry.pokemon),
          img: getPokemonGif(entry.pokemon),
          info: `${entry.count}`,
          cardType: 'pokemon'
        })
      );
    });

    section.append(header, grid);
    container.appendChild(section);
  });
}
