import { loadJson } from './json.loader.js';

export function loadDonators() {
  return loadJson('/data/donators.json', 1);
}
