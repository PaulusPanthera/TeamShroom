// src/data/shinywar.loader.js
// v2.0.0-beta
// Shiny War config loader.

import { loadJson } from './json.loader.js';

export async function loadShinyWarConfig() {
  const rows = await loadJson('/data/shinywar.json', 1);
  return Array.isArray(rows) && rows.length ? rows[0] : null;
}
