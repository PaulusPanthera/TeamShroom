// shinydex.js
// Shiny Dex — VISIBILITY PROBE
// This file intentionally renders a hardcoded card
// to confirm execution + DOM placement.

import { renderUnifiedCard } from '../../ui/unifiedcard.js';
import { prettifyPokemonName } from '../../utils/utils.js';

function getPokemonGif(pokemonKey) {
  return `https://img.pokemondb.net/sprites/black-white/anim/shiny/${pokemonKey}.gif`;
}

export function setupShinyDexHitlistSearch(shinyDex) {
  const container = document.getElementById('shiny-dex-container');

  if (!container) {
    throw new Error('shiny-dex-container not found in DOM');
  }

  // Clear container explicitly
  container.innerHTML = '';

  // HARD VISUAL PROBE — THIS MUST BE VISIBLE
  container.insertAdjacentHTML(
    'beforeend',
    `
    <section class="region-section">
      <h2>DEBUG PROBE</h2>
      <div class="dex-grid">
        ${renderUnifiedCard({
          name: prettifyPokemonName('pikachu'),
          img: getPokemonGif('pikachu'),
          info: 'Probe card',
          cardType: 'pokemon',
          highlighted: true
        })}
      </div>
    </section>
    `
  );
}
