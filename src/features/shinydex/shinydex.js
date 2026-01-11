// src/features/shinydex/shinydex.js
// Shiny Dex — Hitlist & Living Dex
// Render-only. Consumes derived data.

import { renderUnifiedCard } from '../../ui/unifiedcard.js';
import { prettifyPokemonName } from '../../utils/utils.js';
import {
  HITLIST_DEX,
  LIVING_DEX
} from '../../data/pokemondatabuilder.js';

function getPokemonGif(pokemonKey) {
  return `https://img.pokemondb.net/sprites/black-white/anim/shiny/${pokemonKey}.gif`;
}

function renderDex(dex, mode, filter) {
  const container = document.getElementById('shiny-dex-container');
  container.innerHTML = '';
  let shown = 0;

  Object.entries(dex).forEach(([region, entries]) => {
    const list = Object.values(entries).filter(e =>
      !filter || e.pokemon.includes(filter)
    );

    if (!list.length) return;
    shown += list.length;

    const section = document.createElement('section');
    section.innerHTML = `<h2>${region}</h2>`;

    const grid = document.createElement('div');
    grid.className = 'dex-grid';

    list.forEach(entry => {
      grid.insertAdjacentHTML(
        'beforeend',
        renderUnifiedCard({
          name: prettifyPokemonName(entry.pokemon),
          img: getPokemonGif(entry.pokemon),
          info:
            mode === 'hitlist'
              ? entry.claimed
                ? `Claimed`
                : `Unclaimed`
              : `Owned: ${entry.count}`,
          cardType: 'pokemon',
          unclaimed: mode === 'hitlist' && !entry.claimed
        })
      );
    });

    section.appendChild(grid);
    container.appendChild(section);
  });

  return shown;
}

export function setupShinyDexHitlistSearch() {
  const container = document.getElementById('shiny-dex-container');

  const controls = document.createElement('div');
  controls.className = 'search-controls';
  controls.innerHTML = `
    <input type="text" placeholder="Search Pokémon">
    <button data-mode="hitlist" class="active">Hitlist</button>
    <button data-mode="living">Living Dex</button>
    <span class="result-count"></span>
  `;

  container.parentNode.insertBefore(controls, container);

  let mode = 'hitlist';
  let filter = '';

  const input = controls.querySelector('input');
  const buttons = controls.querySelectorAll('button');
  const count = controls.querySelector('.result-count');

  function render() {
    const shown =
      mode === 'hitlist'
        ? renderDex(HITLIST_DEX, 'hitlist', filter)
        : renderDex(LIVING_DEX, 'living', filter);

    count.textContent = `${shown} Pokémon`;
  }

  input.addEventListener('input', e => {
    filter = e.target.value.toLowerCase();
    render();
  });

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      mode = btn.dataset.mode;
      render();
    });
  });

  render();
}
