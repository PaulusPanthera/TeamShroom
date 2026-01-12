// src/domains/shinydex/livingdex.model.js
// Shiny Dex — LIVING DEX MODEL
// CURRENT OWNERSHIP SNAPSHOT
// No claims. No family locking.

import { POKEMON_REGION, POKEMON_SHOW } from '../../data/pokemondatabuilder.js';

/*
OUTPUT:
Array<{
  pokemon: string
  region: string
  count: number
  owners: string[]
}>
*/

export function buildShinyLivingDexModel(showcaseRows) {
  const map = {};

  showcaseRows.forEach(row => {
    if (row.lost || row.sold) return;

    const key = row.pokemon;
    if (POKEMON_SHOW[key] === false) return;

    map[key] ??= {
      pokemon: key,
      region: POKEMON_REGION[key] || 'unknown',
      count: 0,
      owners: []
    };

    map[key].count++;
    map[key].owners.push(row.ot);
  });

  return Object.values(map);
}
