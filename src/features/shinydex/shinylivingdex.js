// src/features/shinydex/shinylivingdex.js
// Shiny Living Dex — VIEW
// Render-only. No claim logic. No history.

import { buildShinyLivingDexModel } from '../../data/shinylivingdex.model.js';
import { renderUnifiedCard } from '../../ui/unifiedcard.js';
import { prettifyPokemonName } from '../../utils/utils.js';
import { POKEMON_SHOW } from '../../data/pokemondatabuilder.js';

function getPokemonGif(pokemonKey) {
  return `https://img.pokemondb.net/sprites/black-white/anim/shiny/${pokemonKey}.gif`;
}

/**
 * Render Shiny Living Dex
 *
 * @param {Array} showcaseRows shinyshowcase.json data
 */
export function renderShinyLivingDex(showcaseRows) {
  const container = document.getElementById('shiny-dex-container');
  container.innerHTML = '';

  /* -------------------------------------------------------
     CONTROLS
  ------------------------------------------------------- */

  const controls = document.createElement('div');
  controls.className = 'dex-controls';

  const searchInput = document.createElement('input');
  searchInput.placeholder = 'Search…';

  const sortSelect = document.createElement('select');
  sortSelect.innerHTML = `
    <option value="standard">Standard</option>
    <option value="count">Total Shinies</option>
  `;

  const totalCounter = document.createElement('div');
  totalCounter.className = 'dex-total';

  controls.append(searchInput, sortSelect, totalCounter);
  container.appendChild(controls);

  const content = document.createElement('div');
  container.appendChild(content);

  /* -------------------------------------------------------
     DATA
  ------------------------------------------------------- */

  const dex = buildShinyLivingDexModel(showcaseRows).filter(
    e => POKEMON_SHOW[e.pokemon] !== false
  );

  /* -------------------------------------------------------
     RENDER
  ------------------------------------------------------- */

  function render(list) {
    content.innerHTML = '';

    const totalShinies = list.reduce((s, e) => s + e.count, 0);
    totalCounter.textContent = `Total Shinies: ${totalShinies}`;

    const byRegion = {};
    list.forEach(e => {
      byRegion[e.region] ??= [];
      byRegion[e.region].push(e);
    });

    Object.entries(byRegion).forEach(([region, entries]) => {
      const header = document.createElement('h2');
      header.textContent = region;

      const grid = document.createElement('div');
      grid.className = 'dex-grid';

      entries.forEach(entry => {
        grid.insertAdjacentHTML(
          'beforeend',
          renderUnifiedCard({
            name: prettifyPokemonName(entry.pokemon),
            img: getPokemonGif(entry.pokemon),
            info: String(entry.count),
            cardType: 'pokemon'
          })
        );
      });

      content.append(header, grid);
    });
  }

  /* -------------------------------------------------------
     PIPELINE
  ------------------------------------------------------- */

  function apply() {
    const q = searchInput.value.toLowerCase();
    let list = dex.filter(e =>
      prettifyPokemonName(e.pokemon).toLowerCase().includes(q)
    );

    if (sortSelect.value === 'count') {
      list = [...list].sort((a, b) => b.count - a.count);
    }

    render(list);
  }

  searchInput.addEventListener('input', apply);
  sortSelect.addEventListener('change', apply);

  apply();
}
