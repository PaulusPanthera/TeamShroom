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
  variantCounts?: { standard:number, secret:number, alpha:number, safari:number }
  variantOwners?: { secret:string[], alpha:string[], safari:string[] }
}>
*/

export function buildShinyLivingDexModel(showcaseRows) {
  function normalizeMethod(m) {
    return String(m || '').trim().toLowerCase();
  }

  function pushUnique(arr, value) {
    const v = String(value || '').trim();
    if (!v) return;
    if (arr.indexOf(v) !== -1) return;
    arr.push(v);
  }

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
      owners: [],
      variantCounts: { standard: 0, secret: 0, alpha: 0, safari: 0 },
      variantOwners: { secret: [], alpha: [], safari: [] }
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
    pushUnique(map[key].owners, row.ot);

    // Standard: any owned shiny counts as a standard collection entry.
    map[key].variantCounts.standard += 1;

    if (row.secret) {
      map[key].variantCounts.secret += 1;
      pushUnique(map[key].variantOwners.secret, row.ot);
    }

    if (row.alpha) {
      map[key].variantCounts.alpha += 1;
      pushUnique(map[key].variantOwners.alpha, row.ot);
    }

    if (normalizeMethod(row.method) === 'safari') {
      map[key].variantCounts.safari += 1;
      pushUnique(map[key].variantOwners.safari, row.ot);
    }
  });

  // -------------------------------------------------------
  // 3. RETURN FULL LIST (DEX ORDER PRESERVED)
  // -------------------------------------------------------

  return Object.values(map);
}
