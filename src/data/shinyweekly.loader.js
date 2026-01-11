import { loadJson } from './loadJson.js';

export function loadShinyWeekly() {
  return loadJson('/data/shinyweekly.json', 1);
}
