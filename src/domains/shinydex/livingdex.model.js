// src/domains/shinydex/livingdex.model.js
// v2.0.0-beta
// Shiny Dex — living dex model (complete species snapshot)

import {
  getPokemonRegionMap,
  getPokemonShowMap
} from '../pokemon/pokemon.data.js';

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
  function pushUnique(arr, value) {
    const v = String(value || '').trim();
    if (!v) return;
    if (arr.indexOf(v) !== -1) return;
    arr.push(v);
  }

  // -------------------------------------------------------
  // 1. INIT ALL POKÉMON (UNOWNED BY DEFAULT)
  // -------------------------------------------------------

  const regionMap = getPokemonRegionMap();
  const showMap = getPokemonShowMap();

  const map = {};

  Object.keys(regionMap).forEach(pokemon => {
    if (showMap[pokemon] === false) return;

    map[pokemon] = {
      pokemon,
      region: regionMap[pokemon] || 'unknown',
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
    if (row.run || row.lost || row.sold) return;

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

    // Safari is determined exclusively by the explicit boolean flag.
    if (row.safari === true) {
      map[key].variantCounts.safari += 1;
      pushUnique(map[key].variantOwners.safari, row.ot);
    }
  });

  // -------------------------------------------------------
  // 3. RETURN FULL LIST (DEX ORDER PRESERVED)
  // -------------------------------------------------------

  return Object.values(map);
}
