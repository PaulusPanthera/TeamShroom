import { loadJson } from './json.loader.js';

export async function loadPokemon() {
  return loadJson('/data/pokemon.json');
}
