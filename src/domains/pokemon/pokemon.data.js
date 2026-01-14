// src/domains/pokemon/pokemon.data.js
// v2.0.0-beta
// Pokémon derived-data domain facade (promise-cached init + read-only getters)

import { loadPokemon } from '../../data/pokemon.loader.js';
import {
  buildPokemonData,
  POKEMON_POINTS,
  POKEMON_SHOW,
  POKEMON_REGION,
  POKEMON_DEX_ORDER,
  pokemonFamilies
} from '../../data/pokemondatabuilder.js';

let initPromise = null;

function hasBuiltDerivedData() {
  const orderOk = Array.isArray(POKEMON_DEX_ORDER) && POKEMON_DEX_ORDER.length > 0;
  const pointsOk = POKEMON_POINTS && typeof POKEMON_POINTS === 'object' && Object.keys(POKEMON_POINTS).length > 0;
  return orderOk && pointsOk;
}

export async function initPokemonDerivedDataOnce() {
  if (hasBuiltDerivedData()) return;

  if (!initPromise) {
    initPromise = (async () => {
      if (hasBuiltDerivedData()) return;
      const rows = await loadPokemon();
      buildPokemonData(Array.isArray(rows) ? rows : []);
    })();
  }

  return initPromise;
}

export function getPokemonDexOrder() {
  return Array.isArray(POKEMON_DEX_ORDER) ? POKEMON_DEX_ORDER : [];
}

export function getPokemonPointsMap() {
  return POKEMON_POINTS && typeof POKEMON_POINTS === 'object' ? POKEMON_POINTS : {};
}

export function getPokemonShowMap() {
  return POKEMON_SHOW && typeof POKEMON_SHOW === 'object' ? POKEMON_SHOW : {};
}

export function getPokemonRegionMap() {
  return POKEMON_REGION && typeof POKEMON_REGION === 'object' ? POKEMON_REGION : {};
}

export function getPokemonFamiliesMap() {
  return pokemonFamilies && typeof pokemonFamilies === 'object' ? pokemonFamilies : {};
}

export function getPokemonPoints(pokemonKey) {
  const key = String(pokemonKey || '').toLowerCase();
  if (!key) return 0;

  const map = getPokemonPointsMap();
  const v = Object.prototype.hasOwnProperty.call(map, key) ? map[key] : 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function getDexIndexMap() {
  const idx = {};
  const order = getPokemonDexOrder();
  for (let i = 0; i < order.length; i++) {
    const k = String(order[i] || '').toLowerCase();
    if (!k) continue;
    idx[k] = i;
  }
  return idx;
}
