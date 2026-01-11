import { loadJson } from './loadJson.js';

export function loadDonators() {
  return loadJson('/data/donators.json', 1);
}
