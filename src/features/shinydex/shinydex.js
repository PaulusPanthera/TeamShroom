// src/features/shinydex/shinydex.js
// Shiny Dex — HITLIST VIEW
// Render-only. No logic. No normalization of claims.

import { buildShinyDexModel } from '../../data/shinydex.model.js';
import { renderUnifiedCard } from '../../ui/unifiedcard.js';
import { prettifyPokemonName } from '../../utils/utils.js';

function getPokemonGif(pokemonKey) {
  // PokémonDB canonical sprite keys
  // Explicit handling for known special cases
  const spriteKey = pokemonKey
    .toLowerCase()
    .replace('. ', '-')   // Mr. Mime → mr-mime
    .replace(' ', '-');

  return `https://img.pokemondb.net/sprites/black-white/anim/shiny/${spriteKey}.gif`;
}

/**
 * Render Shiny Dex Hitlist
 *
 * @param {Array} weeklyModel Output of buildShinyWeeklyModel()
 */
export function renderShinyDexHitlist(weeklyModel) {
  const container = document.getElementById('shiny-dex-container');
  container.innerHTML = '';

  const grid = document.createElement('div');
  grid.className = 'dex-grid';

  const dex = buildShinyDexModel(weeklyModel);

  dex.forEach(entry => {
    grid.insertAdjacentHTML(
      'beforeend',
      renderUnifiedCard({
        name: prettifyPokemonName(entry.pokemon),
        img: getPokemonGif(entry.pokemon),
        info: entry.claimed ? entry.claimedBy : 'Unclaimed',
        points: entry.points,
        claimed: entry.claimed,
        cardType: 'pokemon'
      })
    );
  });

  container.appendChild(grid);
}
