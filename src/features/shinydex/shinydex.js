// src/features/shinydex/shinydex.js
// Shiny Dex — HITLIST VIEW
// Render-only. No claim logic. UI-only search.

import { buildShinyDexModel } from '../../data/shinydex.model.js';
import { renderUnifiedCard } from '../../ui/unifiedcard.js';
import { prettifyPokemonName } from '../../utils/utils.js';

function getPokemonGif(pokemonKey) {
  const spriteKey = pokemonKey
    .toLowerCase()
    .replace('. ', '-')
    .replace(' ', '-');

  return `https://img.pokemondb.net/sprites/black-white/anim/shiny/${spriteKey}.gif`;
}

/**
 * Render Shiny Dex Hitlist with search
 *
 * @param {Array} weeklyModel Output of buildShinyWeeklyModel()
 */
export function renderShinyDexHitlist(weeklyModel) {
  const container = document.getElementById('shiny-dex-container');
  container.innerHTML = '';

  // -------------------------------------------------------
  // SEARCH INPUT
  // -------------------------------------------------------

  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.placeholder = 'Search Pokémon…';
  searchInput.className = 'dex-search';

  container.appendChild(searchInput);

  // -------------------------------------------------------
  // GRID
  // -------------------------------------------------------

  const grid = document.createElement('div');
  grid.className = 'dex-grid';
  container.appendChild(grid);

  // -------------------------------------------------------
  // DATA
  // -------------------------------------------------------

  const dex = buildShinyDexModel(weeklyModel);

  function render(filtered) {
    grid.innerHTML = '';

    filtered.forEach(entry => {
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
  }

  // Initial render
  render(dex);

  // -------------------------------------------------------
  // SEARCH HANDLER
  // -------------------------------------------------------

  searchInput.addEventListener('input', () => {
    const q = searchInput.value.trim().toLowerCase();

    if (!q) {
      render(dex);
      return;
    }

    const filtered = dex.filter(entry =>
      prettifyPokemonName(entry.pokemon)
        .toLowerCase()
        .includes(q)
    );

    render(filtered);
  });
}
