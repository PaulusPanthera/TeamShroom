// shinydexsearch.js
// Shiny Dex Hitlist & Living Dex — HARD CONTRACT
// One card size. One layout. Full feature parity restored.

import { renderUnifiedCard } from './unifiedcard.js';
import { normalizePokemonName, prettifyPokemonName } from './utils.js';

/* ---------------------------------------------------------
   SPRITES
--------------------------------------------------------- */

function getPokemonGif(name) {
  const n = name.toLowerCase().replace(/[\s.'’\-]/g, '');
  const map = {
    mrmime: 'mr-mime',
    mimejr: 'mime-jr',
    nidoranf: 'nidoran-f',
    nidoranm: 'nidoran-m',
    typenull: 'type-null',
    porygonz: 'porygon-z'
  };
  const key = map[n] || normalizePokemonName(name);
  return `https://img.pokemondb.net/sprites/black-white/anim/shiny/${key}.gif`;
}

/* ---------------------------------------------------------
   HELPERS
--------------------------------------------------------- */

function getPoints(name, POKEMON_POINTS) {
  const pts = POKEMON_POINTS?.[normalizePokemonName(name)];
  return !pts || pts === 'NA' ? 0 : pts;
}

function buildLivingCounts(teamShowcase, POKEMON_POINTS) {
  const counts = {};
  teamShowcase.forEach(member => {
    member.shinies?.forEach(mon => {
      if (mon.lost) return;
      const pts = getPoints(mon.name, POKEMON_POINTS);
      if (!pts) return;
      const key = normalizePokemonName(mon.name);
      counts[key] = (counts[key] || 0) + 1;
    });
  });
  return counts;
}

function filterEntry(entry, filter, POKEMON_POINTS) {
  const pts = getPoints(entry.name, POKEMON_POINTS);
  if (!pts || entry.claimed === 'NA') return false;
  if (!filter) return true;

  const f = filter.toLowerCase();

  if (f === 'claimed') return !!entry.claimed;
  if (f === 'unclaimed') return !entry.claimed;

  if (entry.region?.toLowerCase() === f) return true;

  return (
    entry.name.toLowerCase().includes(f) ||
    entry.claimed?.toLowerCase().includes(f)
  );
}

/* ---------------------------------------------------------
   RENDERERS
--------------------------------------------------------- */

function renderHitlist(shinyDex, filter, POKEMON_POINTS) {
  const container = document.getElementById('shiny-dex-container');
  container.innerHTML = '';
  let shown = 0;

  Object.entries(shinyDex).forEach(([region, entries]) => {
    const filtered = entries.filter(e =>
      filterEntry(e, filter, POKEMON_POINTS)
    );
    if (!filtered.length) return;

    shown += filtered.length;

    const section = document.createElement('section');
    section.className = 'region-section';
    section.innerHTML = `<h2>${region}</h2>`;

    const grid = document.createElement('div');
    grid.className = 'dex-grid';

    filtered.forEach(entry => {
      grid.insertAdjacentHTML('beforeend',
        renderUnifiedCard({
          name: prettifyPokemonName(entry.name),
          img: getPokemonGif(entry.name),
          info: entry.claimed || 'Unclaimed',
          cardType: 'pokemon',
          states: {
            pokemon: true,
            unclaimed: !entry.claimed
          }
        })
      );
    });

    section.appendChild(grid);
    container.appendChild(section);
  });

  return shown;
}

function renderLivingDex(shinyDex, teamShowcase, filter, POKEMON_POINTS) {
  const container = document.getElementById('shiny-dex-container');
  container.innerHTML = '';
  const counts = buildLivingCounts(teamShowcase, POKEMON_POINTS);
  let shown = 0;

  Object.entries(shinyDex).forEach(([region, entries]) => {
    const filtered = entries.filter(e =>
      filterEntry(e, filter, POKEMON_POINTS)
    );
    if (!filtered.length) return;

    shown += filtered.length;

    const section = document.createElement('section');
    section.className = 'region-section';
    section.innerHTML = `<h2>${region}</h2>`;

    const grid = document.createElement('div');
    grid.className = 'dex-grid';

    filtered.forEach(entry => {
      const key = normalizePokemonName(entry.name);
      grid.insertAdjacentHTML('beforeend',
        renderUnifiedCard({
          name: prettifyPokemonName(entry.name),
          img: getPokemonGif(entry.name),
          info: `Owned: ${counts[key] || 0}`,
          cardType: 'pokemon',
          states: {
            pokemon: true
          }
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

export function setupShinyDexHitlistSearch(shinyDex, teamShowcase) {
  const POKEMON_POINTS = window.POKEMON_POINTS || {};

  const container = document.getElementById('shiny-dex-container');
  const controls = document.createElement('div');
  controls.className = 'search-controls';

  controls.innerHTML = `
    <input type="text" placeholder="Search">
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
    let shown = 0;
    if (mode === 'hitlist') {
      shown = renderHitlist(shinyDex, filter, POKEMON_POINTS);
    } else {
      shown = renderLivingDex(shinyDex, teamShowcase, filter, POKEMON_POINTS);
    }
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
