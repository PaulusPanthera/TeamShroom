// src/features/shinydex/shinydex.js
// Shiny Dex — PHASE 1 VISIBILITY CHECK
// Render Pokémon cards only. No claims. No weekly logic.

import { renderUnifiedCard } from '../../ui/unifiedcard.js';
import { prettifyPokemonName } from '../../utils/utils.js';
import {
  POKEMON_POINTS,
  POKEMON_SHOW
} from '../../data/pokemondatabuilder.js';

function getPokemonGif(pokemonKey) {
  return `https://img.pokemondb.net/sprites/black-white/anim/shiny/${pokemonKey}.gif`;
}

export function setupShinyDexHitlistSearch() {
  const container = document.getElementById('shiny-dex-container');
  container.innerHTML = '';

  const grid = document.createElement('div');
  grid.className = 'dex-grid';

  let rendered = 0;

  Object.keys(POKEMON_POINTS).forEach(pokemon => {
    if (!POKEMON_SHOW[pokemon]) return;

    rendered++;

    grid.insertAdjacentHTML(
      'beforeend',
      renderUnifiedCard({
        name: prettifyPokemonName(pokemon),
        img: getPokemonGif(pokemon),
        info: 'Visible',
        cardType: 'pokemon'
      })
    );
  });

  container.appendChild(grid);

  if (rendered === 0) {
    container.innerHTML = '<p>No Pokémon rendered.</p>';
  }
}
