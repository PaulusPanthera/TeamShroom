import { loadJson } from './json.loader.js';

export function loadShinyShowcase() {
  return loadJson('/data/shinyshowcase.json', 1);
}
