import { loadJson } from './json.loader.js';

export function loadPokemon() {
  return loadJson('/data/pokemon.json', 1);
}
