import { loadJson } from './json.loader.js';

export function loadShinyWeekly() {
  return loadJson('/data/shinyweekly.json', 1);
}
