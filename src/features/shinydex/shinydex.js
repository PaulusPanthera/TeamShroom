// shinydex.js
// Shiny Dex — Hitlist & Living Dex
// JSON-first runtime, CI-normalized data only

import { renderUnifiedCard } from '../../ui/unifiedcard.js';
import { prettifyPokemonName } from '../../utils/utils.js';

/* ---------------------------------------------------------
   SPRITES
--------------------------------------------------------- */

/**
 * Resolve shiny Pokémon GIF from canonical pokemon key.
 *
 * Input MUST already be normalized by CI.
 */
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
   HELPERS
--------------------------------------------------------- */

function getPoints(pokemonKey, POKEMON_POINTS) {
  const pts = POKEMON_POINTS?.[pokemonKey];
  return typeof pts === 'number' ? pts : 0;
}

function buildLivingCounts(teamMembers, POKEMON_POINTS) {
  const counts = {};

  teamMembers.forEach(member => {
    member.shinies?.forEach(mon => {
      if (mon.lost || mon.sold) return;

      const key = mon.pokemon;
      if (!POKEMON_POINTS[key]) return;

      counts[key] = (counts[key] || 0) + 1;
    });
  });

  return counts;
}

function filterEntry(entry, filter, POKEMON_POINTS) {
  const pts = getPoints(entry.pokemon, POKEMON_POINTS);
  if (!pts || entry.show === false) return false;
  if (!filter) return true;

  const f = filter.toLowerCase();

  if (f === 'claimed') return !!entry.claimed;
  if (f === 'unclaimed') return !entry.claimed;

  if (entry.region?.toLowerCase() === f) return true;

  return entry.pokemon.toLowerCase().includes(f);
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
      grid.insertAdjacentHTML(
        'beforeend',
        renderUnifiedCard({
          name: prettifyPokemonName(entry.pokemon),
          img: getPokemonGif(entry.pokemon),
          info: entry.claimed ? 'Claimed' : 'Unclaimed',
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

function renderLivingDex(shinyDex, teamMembers, filter, POKEMON_POINTS) {
  const container = document.getElementById('shiny-dex-container');
  container.innerHTML = '';
  const counts = buildLivingCounts(teamMembers, POKEMON_POINTS);
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
      grid.insertAdjacentHTML(
        'beforeend',
        renderUnifiedCard({
          name: prettifyPokemonName(entry.pokemon),
          img: getPokemonGif(entry.pokemon),
          info: `Owned: ${counts[entry.pokemon] || 0}`,
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

export function setupShinyDexHitlistSearch(
  shinyDex,
  teamMembers,
  POKEMON_POINTS
) {
  const container = document.getElementById('shiny-dex-container');

  const controls = document.createElement('div');
  controls.className = 'search-controls';
  controls.innerHTML = `
    <input type="text" placeholder="Search Pokémon or Region">
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
        ? renderHitlist(shinyDex, filter, POKEMON_POINTS)
        : renderLivingDex(shinyDex, teamMembers, filter, POKEMON_POINTS);

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
