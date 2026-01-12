// src/domains/shinydex/livingdex.model.js
// Shiny Dex — LIVING DEX MODEL
// COMPLETE SPECIES SNAPSHOT (owned + unowned)

import {
  POKEMON_REGION,
  POKEMON_SHOW
} from '../../data/pokemondatabuilder.js';

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
  // -------------------------------------------------------
  // 1. INIT ALL POKÉMON (UNOWNED BY DEFAULT)
  // -------------------------------------------------------

  const map = {};

  Object.keys(POKEMON_REGION).forEach(pokemon => {
    if (POKEMON_SHOW[pokemon] === false) return;

    map[pokemon] = {
      pokemon,
      region: POKEMON_REGION[pokemon] || 'unknown',
      count: 0,
      owners: []
    };
  });

  // -------------------------------------------------------
  // 2. APPLY OWNERSHIP FROM SHOWCASE
  // -------------------------------------------------------

  showcaseRows.forEach(row => {
    if (row.lost || row.sold) return;

    const key = row.pokemon;
    if (!map[key]) return;

    map[key].count += 1;
    map[key].owners.push(row.ot);
  });

  // -------------------------------------------------------
  // 3. RETURN FULL LIST (DEX ORDER PRESERVED)
  // -------------------------------------------------------

  return Object.values(map);
}
