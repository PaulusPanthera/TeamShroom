// src/features/shinydex/shinylivingdex.js
// Shiny Living Dex — species ownership view
// Render-only. No controls. No state ownership.

import { renderUnifiedCard } from '../../ui/unifiedcard.js';
import { prettifyPokemonName } from '../../utils/utils.js';
import {
  POKEMON_SHOW,
  POKEMON_REGION
} from '../../data/pokemondatabuilder.js';
import { buildShinyLivingDexModel } from '../../domains/shinydex/livingdex.model.js';

function getPokemonGif(key) {
  return `https://img.pokemondb.net/sprites/black-white/anim/shiny/${key}.gif`;
}

export function renderShinyLivingDex({
  showcaseRows,
  search,
  unclaimedOnly,
  sort,
  countLabel
}) {
  const container = document.getElementById('shiny-dex-container');
  container.innerHTML = '';

  // --------------------------------------------------
  // BUILD MODEL (DEX ORDER PRESERVED)
  // --------------------------------------------------

  let dex = buildShinyLivingDexModel(showcaseRows).filter(
    e => POKEMON_SHOW[e.pokemon] !== false
  );

  // --------------------------------------------------
  // SEARCH
  // --------------------------------------------------

  if (search) {
    dex = dex.filter(e =>
      prettifyPokemonName(e.pokemon)
        .toLowerCase()
        .includes(search)
    );
  }

  // --------------------------------------------------
  // UNCLAIMED FILTER
  // --------------------------------------------------

  if (unclaimedOnly) {
    dex = dex.filter(e => e.count === 0);
  }

  // --------------------------------------------------
  // SORTING
  // --------------------------------------------------

  if (sort === 'total') {
    dex = [...dex].sort((a, b) => b.count - a.count);
  }
  // else: natural dex order preserved

  // --------------------------------------------------
  // GROUP BY REGION
  // --------------------------------------------------

  const byRegion = {};
  dex.forEach(e => {
    const region = POKEMON_REGION[e.pokemon] || 'unknown';
    byRegion[region] ??= [];
    byRegion[region].push(e);
  });

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

  let totalSpecies = 0;
  let ownedSpecies = 0;

  Object.entries(byRegion).forEach(([region, entries]) => {
    const section = document.createElement('section');
    section.className = 'region-section';

    const total = entries.length;
    const owned = entries.filter(e => e.count > 0).length;

    totalSpecies += total;
    ownedSpecies += owned;

    const header = document.createElement('h2');
    header.textContent =
      `${region.toUpperCase()} (${owned} / ${total})`;

    const grid = document.createElement('div');
    grid.className = 'dex-grid';

    entries.forEach(entry => {
      grid.insertAdjacentHTML(
        'beforeend',
        renderUnifiedCard({
          name: prettifyPokemonName(entry.pokemon),
          img: getPokemonGif(entry.pokemon),
          info:
            entry.count === 1
              ? '1 Shiny'
              : `${entry.count} Shinies`,
          unclaimed: entry.count === 0,
          highlighted: entry.count > 0,
          cardType: 'pokemon'
        })
      );
    });

    section.append(header, grid);
    container.appendChild(section);
  });

  // --------------------------------------------------
  // TOTAL COUNTER
  // --------------------------------------------------

  countLabel.textContent =
    `${ownedSpecies} / ${totalSpecies} Species`;
}
