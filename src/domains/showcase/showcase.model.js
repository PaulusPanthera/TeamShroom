// src/domains/showcase/showcase.model.js
// v2.0.0-beta
// Showcase domain aggregation

import { buildMembersModel } from '../../data/members.model.js';

function normalizeKey(name) {
  return String(name || '').trim().toLowerCase();
}

function isActiveShiny(s) {
  return !(s && (s.lost || s.sold));
}

function getPokemonPoints(pointsMap, pokemonKey) {
  const has = pointsMap && Object.prototype.hasOwnProperty.call(pointsMap, pokemonKey);
  const v = has ? pointsMap[pokemonKey] : 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Build showcase model from members rows + showcase rows.
 *
 * @param {object} params
 * @param {Array} params.membersRows
 * @param {Array} params.showcaseRows
 * @param {Record<string, number>} params.pokemonPoints
 */
export function buildShowcaseModel({ membersRows, showcaseRows, pokemonPoints }) {
  const membersModel = buildMembersModel(
    Array.isArray(membersRows) ? membersRows : [],
    Array.isArray(showcaseRows) ? showcaseRows : []
  );

  const members = membersModel.map(m => {
    const key = normalizeKey(m && m.name);
    const shinies = Array.isArray(m && m.shinies) ? m.shinies : [];
    const owned = shinies.filter(isActiveShiny);

    const inactive = shinies.filter(s => !isActiveShiny(s));
    const lostCount = inactive.filter(s => Boolean(s && s.lost)).length;
    const soldCount = inactive.filter(s => Boolean(s && s.sold)).length;

    // Back-compat: shinyCount is ACTIVE count
    const shinyCount = owned.length;
    const points = owned.reduce((sum, s) => sum + getPokemonPoints(pokemonPoints, s && s.pokemon), 0);

    return {
      ...m,
      key,
      shinyCount,
      points,
      totalShinyCount: shinies.length,
      inactiveShinyCount: inactive.length,
      lostCount,
      soldCount,
      ownedShinies: owned,
      inactiveShinies: inactive
    };
  });

  const byKey = {};
  members.forEach(m => {
    if (!m || !m.key) return;
    byKey[m.key] = m;
  });

  return { members, byKey };
}
