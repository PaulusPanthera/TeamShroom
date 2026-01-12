// src/data/shinyshowcase.loader.js
// Shiny Showcase loader
//
// INTERNAL DATA CONTRACT — SHINY SHOWCASE ROW (CI-OWNED)
//
// Each entry in shinyshowcase.json.data[] has the following shape:
//
// {
//   ot: string                     // original trainer / owner name (lowercase)
//   pokemon: string                // canonical pokemon key
//   method: string | null          // hunt method (e.g. safari, egg, single)
//   secret: boolean                // secret shiny flag
//   alpha: boolean                 // alpha shiny flag
//   run: boolean                   // run-away shiny flag
//   lost: boolean                  // lost shiny flag
//   sold: boolean                  // sold / traded away flag
//   clip: string | null            // video clip URL
//   notes: string | null           // freeform notes
// }
//
// Guarantees:
// - All listed fields are always present
// - Boolean fields are never undefined
// - Nullable fields may be null but are never missing
// - Rows are trusted and pre-normalized by CI
// - No runtime normalization or reshaping occurs

import { loadJson } from './json.loader.js';

export function loadShinyShowcase() {
  return loadJson('/data/shinyshowcase.json', 1);
}
