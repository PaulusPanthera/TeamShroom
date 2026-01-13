// src/features/shinydex/shinydex.search.js
// ShinyDex Search — pure helpers (no DOM, no state)

import { prettifyPokemonName } from '../../utils/utils.js';

/*
Search syntax:
- "text"   → species search
- "+text"  → family search
- "text+"  → family search
- "@name"  → member search
*/

export function normalizeText(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/♀/g, 'f')
    .replace(/♂/g, 'm')
    .replace(/[.'":,!?()[\]{}]/g, '')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseSearch(raw) {
  const s = String(raw || '').trim();
  if (!s) return { kind: 'none', q: '' };

  if (s.startsWith('@')) {
    const q = normalizeText(s.slice(1));
    return q ? { kind: 'member', q } : { kind: 'none', q: '' };
  }

  const familyMode = s.startsWith('+') || s.endsWith('+');
  if (familyMode) {
    const q = normalizeText(s.replace(/^\+/, '').replace(/\+$/, ''));
    return q ? { kind: 'family', q } : { kind: 'none', q: '' };
  }

  const q = normalizeText(s);
  return q ? { kind: 'species', q } : { kind: 'none', q: '' };
}

export function buildSearchContext(dexOrder, pokemonFamilies) {
  const dexIndex = Object.fromEntries(dexOrder.map((k, i) => [k, i]));

  const rootByPokemon = {};
  const stagesByRoot = {};

  dexOrder.forEach(pokemon => {
    const fam = pokemonFamilies?.[pokemon];
    const root = Array.isArray(fam) && fam.length ? fam[0] : pokemon;

    rootByPokemon[pokemon] = root;
    stagesByRoot[root] ??= [];
    stagesByRoot[root].push(pokemon);
  });

  return { dexIndex, rootByPokemon, stagesByRoot };
}

export function speciesMatches(pokemonKey, q) {
  if (!q) return true;

  const display = normalizeText(prettifyPokemonName(pokemonKey));
  const key = normalizeText(pokemonKey);

  return display.includes(q) || key.includes(q);
}

export function memberMatches(name, q) {
  if (!q) return true;
  return normalizeText(name).includes(q);
}

export function resolveFamilyRootsByQuery(ctx, q) {
  const roots = new Set();
  if (!q) return roots;

  Object.entries(ctx.stagesByRoot).forEach(([root, stages]) => {
    const hit = stages.some(p => speciesMatches(p, q));
    if (hit) roots.add(root);
  });

  return roots;
}
