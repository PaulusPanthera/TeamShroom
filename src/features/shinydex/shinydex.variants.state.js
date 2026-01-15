// src/features/shinydex/shinydex.variants.state.js
// v2.0.0-beta
// Feature-owned variant selection state (kept out of shared UI components).

export const VARIANT_KEYS = ['standard', 'secret', 'alpha', 'safari'];

export function normalizeVariant(input) {
  const v = String(input || '').trim().toLowerCase();
  return VARIANT_KEYS.includes(v) ? v : 'standard';
}

export function createSelectedVariantStore() {
  return new Map();
}

export function getSelectedVariant(store, pokemonKey) {
  if (!store || typeof store.get !== 'function') return 'standard';
  return normalizeVariant(store.get(pokemonKey));
}

export function setSelectedVariant(store, pokemonKey, variant) {
  if (!store || typeof store.set !== 'function') return;
  if (!pokemonKey) return;
  store.set(String(pokemonKey), normalizeVariant(variant));
}
