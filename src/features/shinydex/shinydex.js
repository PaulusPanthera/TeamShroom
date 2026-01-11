// src/features/shinydex/shinydex.js
// Shiny Dex — Hitlist & Living Dex
// UI-only. Consumes fully derived data structures.

import { renderUnifiedCard } from '../../ui/unifiedcard.js';
import { prettifyPokemonName } from '../../utils/utils.js';

/* ---------------------------------------------------------
   SPRITES
--------------------------------------------------------- */

function getPokemonGif(pokemonKey) {
  const overrides = {
    mrmime: 'mr-mime',
    mimejr: 'mime-jr',
    'nidoran-f': 'nidoran-f',
    'nidoran-m': 'nidoran-m',
    typenull: 'type-null',
    'porygon-z': 'porygon-z'
  };

  const key = overrides[pokemonKey] || pokemonKey;

  return `https://img.pokemondb.net/sprites/black-white/anim/shiny/${key}.gif`;
}

/* ---------------------------------------------------------
   FILTER
--------------------------------------------------------- */

function filterEntry(entry, filter) {
  if (!filter) return true;

  const f = filter.toLowerCase();

  if (f === 'claimed') return entry.claimed === true;
  if (f === 'unclaimed') return entry.claimed === false;

  return entry.pokemon.includes(f);
}

/* ---------------------------------------------------------
   HITLIST RENDER
--------------------------------------------------------- */

function renderHitlist(hitlistDex, filter) {
  const container = document.getElementById('shiny-dex-container');
  container.innerHTML = '';

  let shown = 0;

  Object.entries(hitlistDex).forEach(([region, entries]) => {
    const filtered = entries.filter(e => filterEntry(e, filter));
    if (!filtered.length) return;

    shown += filtered.length;

    const section = document.createElement('section');
    section.className = 'region-section';
    section.innerHTML = `<h2>${region}</h2>`;

    const grid = document.createElement('div');
    grid.className = 'dex-grid';

    filtered.forEach(entry => {
      grid.insertAdjacentHTML(
        'beforeend',
        renderUnifiedCard({
          name: prettifyPokemonName(entry.pokemon),
          img: getPokemonGif(entry.pokemon),
          info: entry.claimed
            ? `Claimed by ${entry.claimer}`
            : 'Unclaimed',
          cardType: 'pokemon',
          unclaimed: !entry.claimed
        })
      );
    });

    section.appendChild(grid);
    container.appendChild(section);
  });

  return shown;
}

/* ---------------------------------------------------------
   LIVING DEX RENDER
--------------------------------------------------------- */

function renderLivingDex(livingDex, filter) {
  const container = document.getElementById('shiny-dex-container');
  container.innerHTML = '';

  let shown = 0;

  Object.entries(livingDex).forEach(([region, entries]) => {
    const filtered = entries.filter(e => filterEntry(e, filter));
    if (!filtered.length) return;

    shown += filtered.length;

    const section = document.createElement('section');
    section.className = 'region-section';
    section.innerHTML = `<h2>${region}</h2>`;

    const grid = document.createElement('div');
    grid.className = 'dex-grid';

    filtered.forEach(entry => {
      grid.insertAdjacentHTML(
        'beforeend',
        renderUnifiedCard({
          name: prettifyPokemonName(entry.pokemon),
          img: getPokemonGif(entry.pokemon),
          info: `Owned: ${entry.ownedCount}`,
          cardType: 'pokemon'
        })
      );
    });

    section.appendChild(grid);
    container.appendChild(section);
  });

  return shown;
}

/* ---------------------------------------------------------
   ENTRY POINT
--------------------------------------------------------- */

export function setupShinyDexHitlistSearch({
  hitlistDex,
  livingDex
}) {
  const container = document.getElementById('shiny-dex-container');

  const controls = document.createElement('div');
  controls.className = 'search-controls';
  controls.innerHTML = `
    <input type="text" placeholder="Search Pokémon">
    <button class="dex-tab active" data-mode="hitlist">Hitlist</button>
    <button class="dex-tab" data-mode="living">Living Dex</button>
    <span class="result-count"></span>
  `;

  container.parentNode.insertBefore(controls, container);

  let mode = 'hitlist';
  let filter = '';

  const input = controls.querySelector('input');
  const tabs = controls.querySelectorAll('.dex-tab');
  const count = controls.querySelector('.result-count');

  function render() {
    const shown =
      mode === 'hitlist'
        ? renderHitlist(hitlistDex, filter)
        : renderLivingDex(livingDex, filter);

    count.textContent = `${shown} Pokémon`;
  }

  input.addEventListener('input', e => {
    filter = e.target.value.trim().toLowerCase();
    render();
  });

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      mode = tab.dataset.mode;
      render();
    });
  });

  render();
}
