// shinydexsearch.js
// Shiny Dex / Living Dex / Hitlist — Design System v1 aligned

import { renderUnifiedCard } from './unifiedcard.js';
import { normalizePokemonName } from './utils.js';

/* ---------------------------------------------------------
   SPRITE RESOLUTION
--------------------------------------------------------- */

function getPokemonGif(name) {
  const n = name.toLowerCase().replace(/[\s.'’\-]/g, '');
  if (n === 'mrmime') return 'https://img.pokemondb.net/sprites/black-white/anim/shiny/mr-mime.gif';
  if (n === 'mimejr') return 'https://img.pokemondb.net/sprites/black-white/anim/shiny/mime-jr.gif';
  if (n === 'nidoranf') return 'https://img.pokemondb.net/sprites/black-white/anim/shiny/nidoran-f.gif';
  if (n === 'nidoranm') return 'https://img.pokemondb.net/sprites/black-white/anim/shiny/nidoran-m.gif';
  if (n === 'typenull') return 'https://img.pokemondb.net/sprites/black-white/anim/shiny/type-null.gif';
  if (n === 'porygonz') return 'https://img.pokemondb.net/sprites/black-white/anim/shiny/porygon-z.gif';

  return `https://img.pokemondb.net/sprites/black-white/anim/shiny/${normalizePokemonName(name)}.gif`;
}

/* ---------------------------------------------------------
   CORE HELPERS
--------------------------------------------------------- */

function flattenDexData(shinyDex) {
  const out = [];
  Object.entries(shinyDex).forEach(([region, entries]) => {
    entries.forEach((e, idx, arr) => {
      out.push({ ...e, region, familyIndex: idx, familyArr: arr });
    });
  });
  return out;
}

function getPoints(name, POKEMON_POINTS) {
  const pts = POKEMON_POINTS?.[normalizePokemonName(name)];
  return !pts || pts === 'NA' ? 0 : pts;
}

/* ---------------------------------------------------------
   FILTERING
--------------------------------------------------------- */

function filterEntry(entry, filter, pokemonFamilies, POKEMON_POINTS) {
  const pts = getPoints(entry.name, POKEMON_POINTS);
  if (!pts || entry.claimed === 'NA') return false;
  if (!filter) return true;

  const f = filter.trim().toLowerCase();

  if (f === 'claimed') return !!entry.claimed;
  if (f === 'unclaimed') return !entry.claimed;

  if (entry.region?.toLowerCase() === f) return true;

  const nameMatch = entry.name.toLowerCase().includes(f);
  const claimMatch = entry.claimed?.toLowerCase().includes(f);

  return nameMatch || claimMatch;
}

/* ---------------------------------------------------------
   HITLIST RENDER
--------------------------------------------------------- */

function renderShinyDexFiltered(shinyDex, filter, pokemonFamilies, POKEMON_POINTS) {
  const container = document.getElementById('shiny-dex-container');
  container.innerHTML = '';
  let shown = 0;

  Object.entries(shinyDex).forEach(([region, entries]) => {
    const filtered = entries.filter(e =>
      filterEntry(e, filter, pokemonFamilies, POKEMON_POINTS)
    );
    if (!filtered.length) return;

    shown += filtered.length;

    const section = document.createElement('section');
    section.className = 'region-section';
    section.innerHTML = `<h2>${region}</h2>`;

    const grid = document.createElement('div');
    grid.className = 'dex-grid';

    filtered.forEach(entry => {
      grid.innerHTML += renderUnifiedCard({
        name: entry.name,
        img: getPokemonGif(entry.name),
        info: entry.claimed || 'Unclaimed',
        cardType: 'pokemon',
        states: {
          pokemon: true,
          unclaimed: !entry.claimed
        }
      });
    });

    section.appendChild(grid);
    container.appendChild(section);
  });

  return shown;
}

/* ---------------------------------------------------------
   LIVING DEX
--------------------------------------------------------- */

function buildLivingCounts(teamShowcase, POKEMON_POINTS) {
  const counts = {};
  teamShowcase.forEach(m => {
    m.shinies?.forEach(s => {
      if (s.lost) return;
      const pts = getPoints(s.name, POKEMON_POINTS);
      if (!pts) return;
      const key = normalizePokemonName(s.name);
      counts[key] = (counts[key] || 0) + 1;
    });
  });
  return counts;
}

function renderLivingDex(shinyDex, teamShowcase, filter, pokemonFamilies, POKEMON_POINTS) {
  const container = document.getElementById('shiny-dex-container');
  container.innerHTML = '';

  const counts = buildLivingCounts(teamShowcase, POKEMON_POINTS);
  let shown = 0;

  Object.entries(shinyDex).forEach(([region, entries]) => {
    const filtered = entries.filter(e =>
      filterEntry(e, filter, pokemonFamilies, POKEMON_POINTS)
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
      grid.innerHTML += renderUnifiedCard({
        name: entry.name,
        img: getPokemonGif(entry.name),
        info: counts[key] || 0,
        cardType: 'pokemon',
        states: {
          pokemon: true,
          compact: true
        }
      });
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
  const pokemonFamilies = window.pokemonFamilies || {};
  const flattened = flattenDexData(shinyDex);

  const controls = document.createElement('div');
  controls.className = 'search-controls';

  const input = document.createElement('input');
  input.placeholder = 'Search';
  controls.appendChild(input);

  const container = document.getElementById('shiny-dex-container');
  container.parentNode.insertBefore(controls, container);

  let filter = '';

  function render() {
    const n = renderShinyDexFiltered(shinyDex, filter, pokemonFamilies, POKEMON_POINTS);
    controls.dataset.count = n;
  }

  input.addEventListener('input', e => {
    filter = e.target.value.toLowerCase();
    render();
  });

  render();
}
