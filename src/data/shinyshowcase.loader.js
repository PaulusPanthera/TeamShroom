import { loadJson } from './json.loader.js';

export async function loadShinyShowcase() {
  return loadJson('/data/shinyshowcase.json');
}
