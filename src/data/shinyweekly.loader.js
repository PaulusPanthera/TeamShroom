import { loadJson } from './json.loader.js';

export async function loadShinyWeekly() {
  return loadJson('/data/shinyweekly.json', 1);
}
