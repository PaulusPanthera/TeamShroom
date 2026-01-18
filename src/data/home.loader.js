// src/data/home.loader.js
// v2.0.0-beta
// Home dashboard data loader (next event + bounty + hunter of the week)

import { loadJson } from './json.loader.js';

export function loadHome() {
  return loadJson('/data/home.json', 1);
}
