// src/features/shinydex/shinydex.js
// Shiny Dex — HITLIST VIEW
// Finalized Hitlist v1. Render-only.

import { buildShinyDexModel } from '../../data/shinydex.model.js';
import { renderUnifiedCard } from '../../ui/unifiedcard.js';
import { prettifyPokemonName } from '../../utils/utils.js';
import { POKEMON_SHOW } from '../../data/pokemondatabuilder.js';

function getPokemonGif(pokemonKey) {
  const spriteKey = pokemonKey
    .toLowerCase()
    .replace('. ', '-')
    .replace(' ', '-');

  return `https://img.pokemondb.net/sprites/black-white/anim/shiny/${spriteKey}.gif`;
}

/**
 * Render Shiny Dex Hitlist
 *
 * @param {Array} weeklyModel Output of buildShinyWeeklyModel()
 */
export function renderShinyDexHitlist(weeklyModel) {
  const container = document.getElementById('shiny-dex-container');
  container.innerHTML = '';

  // -------------------------------------------------------
  // CONTROLS
  // -------------------------------------------------------

  const controls = document.createElement('div');
  controls.className = 'dex-controls';

  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.placeholder = 'Search…';
  searchInput.className = 'dex-search';

  const unclaimedToggle = document.createElement('button');
  unclaimedToggle.className = 'dex-toggle';
  unclaimedToggle.textContent = 'Unclaimed';
  unclaimedToggle.dataset.active = 'false';

  const sortSelect = document.createElement('select');
  sortSelect.className = 'dex-sort';
  sortSelect.innerHTML = `
    <option value="standard">Standard</option>
    <option value="claims">Total Claims</option>
    <option value="points">Total Claim Points</option>
  `;

  const totalCounter = document.createElement('div');
  totalCounter.className = 'dex-total';

  controls.appendChild(searchInput);
  controls.appendChild(unclaimedToggle);
  controls.appendChild(sortSelect);
  controls.appendChild(totalCounter);
  container.appendChild(controls);

  // -------------------------------------------------------
  // CONTENT ROOT
  // -------------------------------------------------------

  const content = document.createElement('div');
  container.appendChild(content);

  // -------------------------------------------------------
  // DATA (FILTERED BY SHOW FLAG)
  // -------------------------------------------------------

  const dex = buildShinyDexModel(weeklyModel).filter(
    entry => POKEMON_SHOW[entry.pokemon] !== false
  );

  // -------------------------------------------------------
  // SORTING
  // -------------------------------------------------------

  function sortDex(list, mode) {
    if (mode === 'claims') {
      return [...list].sort((a, b) =>
        Number(b.claimed) - Number(a.claimed)
      );
    }

    if (mode === 'points') {
      return [...list].sort((a, b) =>
        (b.claimed ? b.points : 0) -
        (a.claimed ? a.points : 0)
      );
    }

    return list;
  }

  // -------------------------------------------------------
  // RENDER (REGION + PROGRESS)
  // -------------------------------------------------------

  function render(list) {
    content.innerHTML = '';
    totalCounter.textContent = `${list.length} Pokémon`;

    const byRegion = {};

    list.forEach(entry => {
      const region = entry.region || 'unknown';
      byRegion[region] ??= [];
      byRegion[region].push(entry);
    });

    Object.keys(byRegion).forEach(region => {
      const entries = byRegion[region];
      const claimedCount = entries.filter(e => e.claimed).length;

      const section = document.createElement('section');
      section.className = 'dex-region-section';

      const header = document.createElement('h2');
      header.className = 'dex-region-header';
      header.textContent = `${region.charAt(0).toUpperCase() + region.slice(1)} (${claimedCount} / ${entries.length})`;

      const grid = document.createElement('div');
      grid.className = 'dex-grid';

      entries.forEach(entry => {
        grid.insertAdjacentHTML(
          'beforeend',
          renderUnifiedCard({
            name: prettifyPokemonName(entry.pokemon),
            img: getPokemonGif(entry.pokemon),
            info: entry.claimed ? entry.claimedBy : 'Unclaimed',
            unclaimed: !entry.claimed,
            highlighted: entry.claimed && entry.points >= 15,
            cardType: 'pokemon'
          })
        );
      });

      section.appendChild(header);
      section.appendChild(grid);
      content.appendChild(section);
    });
  }

  // -------------------------------------------------------
  // FILTER PIPELINE
  // -------------------------------------------------------

  function applyFilters() {
    let filtered = dex.slice();
    const raw = searchInput.value.trim();

    if (unclaimedToggle.dataset.active === 'true') {
      filtered = filtered.filter(e => !e.claimed);
    }

    if (raw) {
      const tokens = raw.split(/\s+/);

      tokens.forEach(token => {
        const t = token.toLowerCase();

        if (t.startsWith('@')) {
          const q = token.slice(1).toLowerCase();
          filtered = filtered.filter(
            e => e.claimedBy && e.claimedBy.toLowerCase().includes(q)
          );
          return;
        }

        if (t === 'claimed') {
          filtered = filtered.filter(e => e.claimed);
          return;
        }

        if (t === 'unclaimed') {
          filtered = filtered.filter(e => !e.claimed);
          return;
        }

        if (t.startsWith('region:')) {
          const region = t.split(':')[1];
          filtered = filtered.filter(
            e => e.region && e.region.toLowerCase() === region
          );
          return;
        }

        if (t.startsWith('tier:')) {
          const tier = t.split(':')[1];
          filtered = filtered.filter(
            e => String(e.tier).toLowerCase() === tier
          );
          return;
        }

        const isFamily =
          token.startsWith('+') || token.endsWith('+');

        if (isFamily) {
          const q = token.replace(/\+/g, '').toLowerCase();
          const families = dex
            .filter(e =>
              prettifyPokemonName(e.pokemon)
                .toLowerCase()
                .includes(q)
            )
            .map(e => e.family);

          filtered = filtered.filter(e =>
            families.includes(e.family)
          );
          return;
        }

        filtered = filtered.filter(e =>
          prettifyPokemonName(e.pokemon)
            .toLowerCase()
            .includes(t)
        );
      });
    }

    render(sortDex(filtered, sortSelect.value));
  }

  // -------------------------------------------------------
  // EVENTS
  // -------------------------------------------------------

  searchInput.addEventListener('input', applyFilters);
  sortSelect.addEventListener('change', applyFilters);

  unclaimedToggle.addEventListener('click', () => {
    const active = unclaimedToggle.dataset.active === 'true';
    unclaimedToggle.dataset.active = String(!active);
    unclaimedToggle.classList.toggle('active', !active);
    applyFilters();
  });

  // Initial render
  render(dex);
}
