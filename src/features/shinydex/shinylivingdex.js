// src/features/shinydex/shinylivingdex.js
// Shiny Living Dex — Render Only

import { renderUnifiedCard } from '../../ui/unifiedcard.js';
import { prettifyPokemonName } from '../../utils/utils.js';
import {
  POKEMON_REGION,
  POKEMON_SHOW
} from '../../data/pokemondatabuilder.js';

function getPokemonGif(key) {
  return `https://img.pokemondb.net/sprites/black-white/anim/shiny/${key}.gif`;
}

function attachOwnerTooltip(card, owners) {
  if (owners.length <= 1) return;

  let tooltip;

  card.addEventListener('mouseenter', () => {
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

    const r = card.getBoundingClientRect();
    tooltip.style.left = `${r.left + r.width / 2}px`;
    tooltip.style.top = `${r.top - 10}px`;
    tooltip.style.transform = 'translate(-50%, -100%)';
  });

  card.addEventListener('mouseleave', () => tooltip?.remove());
}

export function renderShinyLivingDex({
  showcaseRows,
  search,
  sort,
  unclaimedOnly,
  container,
  totalCounter
}) {
  container.innerHTML = '';

  const map = {};

  showcaseRows.forEach(r => {
    if (r.lost || r.sold) return;
    if (POKEMON_SHOW[r.pokemon] === false) return;

    map[r.pokemon] ??= {
      pokemon: r.pokemon,
      region: POKEMON_REGION[r.pokemon] || 'unknown',
      count: 0,
      owners: new Set()
    };

    map[r.pokemon].count++;
    map[r.pokemon].owners.add(r.ot);
  });

  let entries = Object.values(map).map(e => ({
    ...e,
    owners: [...e.owners]
  }));

  if (unclaimedOnly) {
    entries = entries.filter(e => e.count === 0);
  }

  if (search) {
    entries = entries.filter(e =>
      e.pokemon.includes(search)
    );
  }

  if (sort === 'total') {
    entries.sort((a, b) => b.count - a.count);
  } else {
    entries.sort((a, b) =>
      a.pokemon.localeCompare(b.pokemon)
    );
  }

  totalCounter.textContent = `${entries.length} Pokémon`;

  const byRegion = {};
  entries.forEach(e => {
    byRegion[e.region] ??= [];
    byRegion[e.region].push(e);
  });

  Object.entries(byRegion).forEach(([region, list]) => {
    const section = document.createElement('section');
    section.className = 'region-section';

    const h = document.createElement('h2');
    h.textContent = region.toUpperCase();

    const grid = document.createElement('div');
    grid.className = 'dex-grid';

    list.forEach(e => {
      const wrap = document.createElement('div');
      wrap.innerHTML = renderUnifiedCard({
        name: prettifyPokemonName(e.pokemon),
        img: getPokemonGif(e.pokemon),
        info: e.count === 1 ? '1 Shiny' : `${e.count} Shinies`,
        cardType: 'pokemon'
      });

      const card = wrap.firstElementChild;
      attachOwnerTooltip(card, e.owners);
      grid.appendChild(card);
    });

    section.append(h, grid);
    container.appendChild(section);
  });
}
