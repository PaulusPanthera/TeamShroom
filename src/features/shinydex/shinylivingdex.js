// src/features/shinydex/shinylivingdex.js
// Shiny Living Dex — CURRENT OWNERSHIP VIEW

import { renderUnifiedCard } from '../../ui/unifiedcard.js';
import { prettifyPokemonName } from '../../utils/utils.js';
import {
  POKEMON_SHOW,
  POKEMON_REGION
} from '../../data/pokemondatabuilder.js';

function getPokemonGif(pokemonKey) {
  return `https://img.pokemondb.net/sprites/black-white/anim/shiny/${pokemonKey}.gif`;
}

export function renderShinyLivingDex(showcaseRows, controlsState) {
  const container = document.getElementById('shiny-dex-container');
  container.innerHTML = '';

  // ---------------- BUILD FULL DEX ----------------
  const allPokemon = Object.keys(POKEMON_SHOW).filter(
    p => POKEMON_SHOW[p] !== false
  );

  const map = {};
  allPokemon.forEach(p => {
    map[p] = {
      pokemon: p,
      region: POKEMON_REGION[p] || 'unknown',
      count: 0,
      owners: new Set()
    };
  });

  showcaseRows.forEach(r => {
    if (r.lost || r.sold) return;
    if (!map[r.pokemon]) return;
    map[r.pokemon].count++;
    map[r.pokemon].owners.add(r.ot);
  });

  let entries = Object.values(map);

  // ---------------- SEARCH ----------------
  entries = entries.filter(e =>
    prettifyPokemonName(e.pokemon)
      .toLowerCase()
      .includes(controlsState.search)
  );

  // ---------------- UNCLAIMED ----------------
  if (controlsState.unclaimedOnly) {
    entries = entries.filter(e => e.count === 0);
  }

  // ---------------- SORT ----------------
  if (controlsState.mode === 'total') {
    entries.sort((a, b) => b.count - a.count);
  }

  // ---------------- RENDER BY REGION ----------------
  const byRegion = {};
  entries.forEach(e => {
    byRegion[e.region] ??= [];
    byRegion[e.region].push(e);
  });

  Object.entries(byRegion).forEach(([region, list]) => {
    const section = document.createElement('section');
    section.className = 'region-section';

    const ownedCount = list.filter(e => e.count > 0).length;

    const header = document.createElement('h2');
    header.textContent = `${region.toUpperCase()} (${ownedCount} / ${list.length})`;

    const grid = document.createElement('div');
    grid.className = 'dex-grid';

    list.forEach(entry => {
      grid.insertAdjacentHTML(
        'beforeend',
        renderUnifiedCard({
          name: prettifyPokemonName(entry.pokemon),
          img: getPokemonGif(entry.pokemon),
          info:
            entry.count === 0
              ? '0 Shinies'
              : `${entry.count} ${entry.count === 1 ? 'Shiny' : 'Shinies'}`,
          unclaimed: entry.count === 0,
          cardType: 'pokemon'
        })
      );
    });

    section.append(header, grid);
    container.appendChild(section);
  });
}
