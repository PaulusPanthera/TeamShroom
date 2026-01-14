// src/features/pokedex/pokedex.adapter.js
// v2.0.0-beta
// ShinyDex adapter boundary for the Pokédex shell
//
// This file is the only import boundary from Pokédex → ShinyDex.
// Prevents accidental coupling to internal ShinyDex modules.

import { setupShinyDexPage } from '../shinydex/shinydex.js';

export function mountShinyPokedex({ weeklyModel, shinyShowcaseRows }) {
  setupShinyDexPage({ weeklyModel, shinyShowcaseRows });
}
