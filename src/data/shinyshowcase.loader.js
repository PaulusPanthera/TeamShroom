import { loadJson } from './loadJson.js';

export function loadShinyShowcase() {
  return loadJson('/data/shinyshowcase.json', 1);
}
