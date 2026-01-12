// src/features/shinydex/shinylivingdex.js
// Shiny Living Dex — VIEW

import { buildShinyLivingDexModel } from '../../data/shinylivingdex.model.js';
import { renderUnifiedCard } from '../../ui/unifiedcard.js';
import { prettifyPokemonName } from '../../utils/utils.js';
import { POKEMON_SHOW } from '../../data/pokemondatabuilder.js';

function getPokemonGif(pokemonKey) {
  return `https://img.pokemondb.net/sprites/black-white/anim/shiny/${pokemonKey}.gif`;
}

export function renderShinyLivingDex(showcaseRows) {
  const container = document.getElementById('shiny-dex-container');
  container.innerHTML = '';

  const controls = document.createElement('div');
  controls.className = 'search-controls';

  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.placeholder = 'Search…';

  const sortSelect = document.createElement('select');
  sortSelect.innerHTML = `
    <option value="standard">Standard</option>
    <option value="count">Total Shinies</option>
  `;

  const totalCounter = document.createElement('span');

  controls.append(searchInput, sortSelect, totalCounter);
  container.appendChild(controls);

  const content = document.createElement('div');
  container.appendChild(content);

  const dex = buildShinyLivingDexModel(showcaseRows).filter(
    e => POKEMON_SHOW[e.pokemon] !== false
  );

  function render(list) {
    content.innerHTML = '';

    const total = list.reduce((s, e) => s + e.count, 0);
    totalCounter.textContent = `Total Shinies: ${total}`;

    const byRegion = {};
    list.forEach(e => {
      byRegion[e.region] ??= [];
      byRegion[e.region].push(e);
    });

    Object.entries(byRegion).forEach(([region, entries]) => {
      const section = document.createElement('section');
      section.className = 'region-section';

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

      section.append(header, grid);
      content.appendChild(section);
    });
  }

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
