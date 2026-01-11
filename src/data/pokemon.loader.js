import { loadJson } from './loadJson.js';

export function loadPokemon() {
  return loadJson('/data/pokemon.json', 1);
}
