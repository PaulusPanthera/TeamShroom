// src/data/shinylivingdex.model.js
// Shiny Living Dex — MODEL
// Current ownership snapshot derived from Shiny Showcase only

import {
  POKEMON_REGION,
  POKEMON_SHOW,
  POKEMON_POINTS
} from './pokemondatabuilder.js';

/**
 * Build Shiny Living Dex model
 *
 * @param {Array} showcaseRows Output of shinyshowcase.json (data array)
 * @returns {Array}
 */
export function buildShinyLivingDexModel(showcaseRows) {
  // -------------------------------------------------------
  // INITIALIZE DEX SHELL (POKÉDEX ORDER)
  // -------------------------------------------------------

  const dex = {};
  const ownerSets = {};

  Object.keys(POKEMON_POINTS).forEach(pokemon => {
    if (POKEMON_SHOW[pokemon] === false) return;

    dex[pokemon] = {
      pokemon,
      region: POKEMON_REGION[pokemon] || 'unknown',
      count: 0,
      owners: []
    };

    ownerSets[pokemon] = new Set();
  });

  // -------------------------------------------------------
  // AGGREGATE SHOWCASE ROWS
  // -------------------------------------------------------

  showcaseRows.forEach(row => {
    if (row.lost === true) return;
    if (row.sold === true) return;

    const pokemon = row.pokemon;
    if (!dex[pokemon]) return;

    dex[pokemon].count += 1;
    ownerSets[pokemon].add(row.ot);
  });

  // -------------------------------------------------------
  // FINALIZE OWNERS (DEDUPE)
  // -------------------------------------------------------

  Object.keys(dex).forEach(pokemon => {
    dex[pokemon].owners = Array.from(ownerSets[pokemon]);
  });

  // -------------------------------------------------------
  // RETURN IN POKÉDEX ORDER
  // -------------------------------------------------------

  return Object.keys(POKEMON_POINTS)
    .filter(pokemon => dex[pokemon])
    .map(pokemon => dex[pokemon]);
}
