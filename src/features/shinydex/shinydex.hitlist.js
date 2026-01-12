// src/features/shinydex/shinydex.hitlist.js
// Standard Hitlist rendering

import { renderUnifiedCard } from '../../ui/unifiedcard.js';
import { prettifyPokemonName } from '../../utils/utils.js';
import { POKEMON_REGION } from '../../data/pokemondatabuilder.js';

function getGif(key) {
  return `https://img.pokemondb.net/sprites/black-white/anim/shiny/${key}.gif`;
}

export function renderHitlistStandard(list, container, totalCounter) {
  totalCounter.textContent = `${list.length} Pokémon`;

  const byRegion = {};

  list.forEach(e => {
    const region =
      (POKEMON_REGION[e.pokemon] || 'unknown').toUpperCase();
    byRegion[region] ??= [];
    byRegion[region].push(e);
  });

  Object.entries(byRegion).forEach(([region, entries]) => {
    const section = document.createElement('section');
    section.className = 'region-section';

    const claimed = entries.filter(e => e.claimed).length;
    section.innerHTML = `<h2>${region} (${claimed} / ${entries.length})</h2>`;

    const grid = document.createElement('div');
    grid.className = 'dex-grid';

    entries.forEach(e => {
      grid.insertAdjacentHTML(
        'beforeend',
        renderUnifiedCard({
          name: prettifyPokemonName(e.pokemon),
          img: getGif(e.pokemon),
          info: e.claimed ? e.claimedBy : 'Unclaimed',
          unclaimed: !e.claimed,
          highlighted: e.claimed && e.points >= 15,
          cardType: 'pokemon'
        })
      );
    });

    section.appendChild(grid);
    container.appendChild(section);
  });
}
