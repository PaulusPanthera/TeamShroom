// src/data/pokemon.loader.js
// Pokémon base data loader
//
// INTERNAL DATA CONTRACT — POKÉMON ROW (CI-OWNED)
//
// Each entry in pokemon.json.data[] has the following shape:
//
// {
//   dex: string                  // national dex number (string)
//   pokemon: string              // canonical pokemon key (lowercase)
//   family: string[]             // evolution family root(s)
//   tier: string                 // e.g. "tier 0", "tier 1", "tier lm"
//   region: string               // e.g. "kanto"
//   rarity: string | null        // e.g. "starter", "legendary"
//   show: boolean                // visibility flag
// }
//
// Guarantees:
// - Data is pre-normalized by CI
// - `pokemon` is the canonical identifier used across the site
// - No runtime reshaping or validation occurs here
// - Consumers must respect this exact shape

import { loadJson } from './json.loader.js';

export function loadPokemon() {
  return loadJson('/data/pokemon.json', 1);
}
