import { loadJson } from './json.loader.js';

export async function loadDonators() {
  return loadJson('/data/donators.json');
}
