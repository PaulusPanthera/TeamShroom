// src/features/pokedex/pokedex.adapter.js
// v2.0.0-beta
// ShinyDex adapter boundary for the Pokedex shell
//
// This file is the only import boundary from Pokedex to ShinyDex.
// Prevents accidental coupling to internal ShinyDex modules.

import { setupShinyDexPage } from '../shinydex/shinydex.js';

export function mountShinyPokedex(root, { weeklyModel, shinyShowcaseRows, sidebar, signal } = {}) {
  return setupShinyDexPage({ root, weeklyModel, shinyShowcaseRows, sidebar, signal });
}
