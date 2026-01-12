// src/features/shinydex/shinydex.js
// Shiny Dex — HITLIST VIEW
// Render-only. Advanced search + region grouping.
// No claim logic. No model mutation.

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
 * Render Shiny Dex Hitlist
 *
 * Sorting:
 * - Primary: region
 * - Secondary: Pokédex order (implicit from data)
 *
 * Search grammar (AND-combined tokens):
 * - pokemon name
 * - @Member
 * - +pokemon / pokemon+
 * - claimed | unclaimed
 * - region:<region>
 * - tier:<tier>
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
  searchInput.placeholder = 'Search…';
  searchInput.className = 'dex-search';
  container.appendChild(searchInput);

  // -------------------------------------------------------
  // CONTENT ROOT
  // -------------------------------------------------------

  const content = document.createElement('div');
  container.appendChild(content);

  // -------------------------------------------------------
  // DATA
  // -------------------------------------------------------

  const dex = buildShinyDexModel(weeklyModel);

  // -------------------------------------------------------
  // RENDER (GROUPED BY REGION)
  // -------------------------------------------------------

  function render(list) {
    content.innerHTML = '';

    const byRegion = {};

    list.forEach(entry => {
      const region = entry.region || 'unknown';
      byRegion[region] ??= [];
      byRegion[region].push(entry);
    });

    Object.keys(byRegion).forEach(region => {
      const section = document.createElement('section');
      section.className = 'dex-region-section';

      const header = document.createElement('h2');
      header.className = 'dex-region-header';
      header.textContent =
        region.charAt(0).toUpperCase() + region.slice(1);

      const grid = document.createElement('div');
      grid.className = 'dex-grid';

      byRegion[region].forEach(entry => {
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

      section.appendChild(header);
      section.appendChild(grid);
      content.appendChild(section);
    });
  }

  render(dex);

  // -------------------------------------------------------
  // SEARCH PARSER
  // -------------------------------------------------------

  searchInput.addEventListener('input', () => {
    const raw = searchInput.value.trim();
    if (!raw) {
      render(dex);
      return;
    }

    const tokens = raw.split(/\s+/);
    let filtered = dex.slice();

    tokens.forEach(token => {
      const t = token.toLowerCase();

      // Claimer
      if (t.startsWith('@')) {
        const q = token.slice(1).toLowerCase();
        filtered = filtered.filter(
          e => e.claimedBy && e.claimedBy.toLowerCase().includes(q)
        );
        return;
      }

      // Claim state
      if (t === 'claimed') {
        filtered = filtered.filter(e => e.claimed);
        return;
      }

      if (t === 'unclaimed') {
        filtered = filtered.filter(e => !e.claimed);
        return;
      }

      // Region
      if (t.startsWith('region:')) {
        const region = t.split(':')[1];
        filtered = filtered.filter(
          e => e.region && e.region.toLowerCase() === region
        );
        return;
      }

      // Tier
      if (t.startsWith('tier:')) {
        const tier = t.split(':')[1];
        filtered = filtered.filter(
          e => String(e.tier).toLowerCase() === tier
        );
        return;
      }

      // Family expansion
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

      // Default: Pokémon name
      filtered = filtered.filter(e =>
        prettifyPokemonName(e.pokemon)
          .toLowerCase()
          .includes(t)
      );
    });

    render(filtered);
  });
}
