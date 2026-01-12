// src/features/shinydex/shinylivingdex.js
// Shiny Living Dex — RENDER ONLY
// Data source: shinyshowcase.json
// No claiming, no family locking

import { renderUnifiedCard } from '../../ui/unifiedcard.js';
import { prettifyPokemonName } from '../../utils/utils.js';
import {
  POKEMON_REGION,
  POKEMON_SHOW
} from '../../data/pokemondatabuilder.js';

/* ---------------------------------------------------------
   SPRITES
--------------------------------------------------------- */

function getPokemonGif(pokemonKey) {
  return `https://img.pokemondb.net/sprites/black-white/anim/shiny/${pokemonKey}.gif`;
}

/* ---------------------------------------------------------
   TOOLTIP
--------------------------------------------------------- */

function attachOwnerTooltip(card, owners) {
  if (!owners.length) return;

  let tooltip;

  card.addEventListener('mouseenter', e => {
    tooltip = document.createElement('div');
    tooltip.className = 'dex-owner-tooltip show';
    tooltip.innerHTML = `
      <div class="owners-title">Owners</div>
      <div class="owners-list">
        <div class="scrolling-names">
          ${owners.join('\n')}
        </div>
      </div>
    `;
    document.body.appendChild(tooltip);

    const rect = card.getBoundingClientRect();
    tooltip.style.left = `${rect.left + rect.width / 2}px`;
    tooltip.style.top = `${rect.top - 10}px`;
    tooltip.style.transform = 'translate(-50%, -100%)';
  });

  card.addEventListener('mouseleave', () => {
    tooltip?.remove();
  });
}

/* ---------------------------------------------------------
   RENDER
--------------------------------------------------------- */

export function renderShinyLivingDex({
  showcaseRows,
  search,
  sort,
  container,
  totalCounter
}) {
  container.innerHTML = '';

  /* ---------------- BUILD MODEL ---------------- */

  const map = {};

  showcaseRows.forEach(row => {
    if (row.lost || row.sold) return;
    if (!POKEMON_SHOW[row.pokemon]) return;

    map[row.pokemon] ??= {
      pokemon: row.pokemon,
      region: POKEMON_REGION[row.pokemon] || 'unknown',
      count: 0,
      owners: new Set()
    };

    map[row.pokemon].count++;
    map[row.pokemon].owners.add(row.ot);
  });

  let entries = Object.values(map).map(e => ({
    ...e,
    owners: Array.from(e.owners)
  }));

  /* ---------------- SEARCH ---------------- */

  if (search) {
    entries = entries.filter(e =>
      e.pokemon.includes(search)
    );
  }

  /* ---------------- SORT ---------------- */

  if (sort === 'total') {
    entries.sort((a, b) => b.count - a.count);
  } else {
    // Standard = dex / region order
    entries.sort((a, b) => a.pokemon.localeCompare(b.pokemon));
  }

  totalCounter.textContent = `${entries.length} Pokémon`;

  /* ---------------- GROUP BY REGION ---------------- */

  const byRegion = {};

  entries.forEach(e => {
    byRegion[e.region] ??= [];
    byRegion[e.region].push(e);
  });

  Object.entries(byRegion).forEach(([region, list]) => {
    const section = document.createElement('section');
    section.className = 'region-section';

    const header = document.createElement('h2');
    header.textContent = region.toUpperCase();

    const grid = document.createElement('div');
    grid.className = 'dex-grid';

    list.forEach(entry => {
      const wrapper = document.createElement('div');
      wrapper.innerHTML = renderUnifiedCard({
        name: prettifyPokemonName(entry.pokemon),
        img: getPokemonGif(entry.pokemon),
        info: `${entry.count} shiny${entry.count > 1 ? 'ies' : ''}`,
        cardType: 'pokemon'
      });

      const card = wrapper.firstElementChild;
      attachOwnerTooltip(card, entry.owners);

      grid.appendChild(card);
    });

    section.append(header, grid);
    container.appendChild(section);
  });
}
