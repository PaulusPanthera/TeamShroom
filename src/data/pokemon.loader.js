// src/data/pokemon.loader.js
// Pokémon base data loader
//
// INTERNAL DATA CONTRACT — POKÉMON ROW
//
// Each entry in pokemon.json.data[] has the following shape:
//
// {
//   id: number                     // national dex number
//   key: string                    // canonical pokemon key (lowercase, hyphenated)
//   name: string                   // display name
//   generation: number             // generation index
//   family: string                 // family identifier
//   stage: number                  // evolution stage within family
//   points: number                 // base point value
// }
//
// Guarantees:
// - All fields are required and always present
// - `key` is the canonical identifier used across the entire site
// - Data is pre-normalized by CI
// - No runtime reshaping or validation occurs

import { loadJson } from './json.loader.js';

export function loadPokemon() {
  return loadJson('/data/pokemon.json', 1);
}
