// src/data/shinyshowcase.loader.js
// Shiny Showcase loader
//
// INTERNAL DATA CONTRACT — SHINY SHOWCASE ROW
//
// Each entry in shinyshowcase.json.data[] has the following shape:
//
// {
//   ot: string                     // original trainer / owner name
//   pokemon: string                // canonical pokemon key
//   date_catch: string | null      // ISO date string or null
//   method: string | null          // hunt method (e.g. safari, egg, single)
//   encounter: number | null       // encounter count, if applicable
//   secret: boolean                // secret shiny flag
//   alpha: boolean                 // alpha shiny flag
//   run: boolean                   // run-away shiny flag
//   lost: boolean                  // lost shiny flag
//   sold: boolean                  // sold / traded away flag
//   favorite: boolean              // user-marked favorite
//   clip: string | null            // video clip URL
//   notes: string | null           // freeform notes
// }
//
// Guarantees:
// - All boolean fields are always present (never undefined)
// - Optional fields may be null but never missing
// - Rows are trusted and pre-normalized by CI
// - No runtime normalization occurs

import { loadJson } from './json.loader.js';

export function loadShinyShowcase() {
  return loadJson('/data/shinyshowcase.json', 1);
}
