// src/features/shinydex/shinydex.js
// Shiny Dex — HITLIST VIEW
// Render-only layer
//
// Rules:
// - No claim logic
// - No weekly parsing
// - No data mutation
// - Uses buildShinyDexModel
// - Uses renderUnifiedCard only

import { buildShinyDexModel } from '../../data/shinydex.model.js';
import { renderUnifiedCard } from '../../ui/unifiedcard.js';
import { prettifyPokemonName } from '../../utils/utils.js';

function getPokemonGif(pokemonKey) {
  return `https://img.pokemondb.net/sprites/black-white/anim/shiny/${pokemonKey}.gif`;
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
        info: entry.claimed
          ? `Claimed by ${entry.claimedBy}`
          : 'Unclaimed',
        points: entry.points,
        claimed: entry.claimed,
        cardType: 'pokemon'
      })
    );
  });

  container.appendChild(grid);
}
