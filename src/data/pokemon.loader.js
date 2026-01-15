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
//   family: string[]             // evolution family root identifier(s)
//   tier: string                 // tier key (e.g. "tier 0", "tier 1", "tier lm")
//   region: string               // region identifier (e.g. "kanto")
//   rarity: string | null        // rarity label or null
//   show: boolean                // visibility flag
// }
//
// Guarantees:
// - All fields are always present
// - `family` is always an array
// - `rarity` may be null but is never missing
// - `pokemon` is the canonical identifier used across the site
// - Data is pre-normalized by CI
// - No runtime reshaping or validation occurs here
// - Consumers must respect this exact shape

import { loadJson } from './json.loader.js';

export function loadPokemon() {
  return loadJson('/data/pokemon.json', 1);
}
