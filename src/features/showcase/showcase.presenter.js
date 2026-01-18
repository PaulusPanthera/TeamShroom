// src/features/showcase/showcase.presenter.js
// v2.0.0-beta
// Showcase presenter (sorting + filtering + view shapes)

import { getMemberRoleEmblemSrc, getMemberSpriteSrc } from '../../domains/members/member.assets.js';

function normalize(str) {
  return String(str || '').trim().toLowerCase();
}

export function filterMembers(members, search) {
  const q = normalize(search);
  if (!q) return Array.isArray(members) ? members : [];
  return (Array.isArray(members) ? members : []).filter(m => normalize(m && m.name).includes(q));
}

export function sortMembers(members, sortMode) {
  const list = Array.isArray(members) ? [...members] : [];

  if (sortMode === 'scoreboard') {
    return list.sort((a, b) => (Number(b.points) || 0) - (Number(a.points) || 0));
  }

  if (sortMode === 'shinies') {
    return list.sort((a, b) => (Number(b.shinyCount) || 0) - (Number(a.shinyCount) || 0));
  }

  return list.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
}


function alphaBucketTitle(name) {
  const raw = String(name || '').trim();
  if (!raw) return '#';
  const ch = raw.charAt(0).toUpperCase();
  if (ch >= 'A' && ch <= 'Z') return ch;
  return '#';
}

function bucketRangeTitle(value, { firstMin, firstMax, step }) {
  const v = Math.max(0, Number(value) || 0);

  // Special first bucket includes both edges (e.g. 0-5 or 0-20).
  if (v <= firstMax) return `${firstMin}-${firstMax}`;

  // Subsequent buckets are contiguous, inclusive ranges:
  // e.g. firstMax=5, step=5 -> 6-10, 11-15, ...
  // e.g. firstMax=20, step=20 -> 21-40, 41-60, ...
  const start = (firstMax + 1) + (Math.floor((v - (firstMax + 1)) / step) * step);
  const end = start + (step - 1);
  return `${start}-${end}`;
}

export function groupMembersForGallery(members, sortMode) {
  const list = Array.isArray(members) ? members : [];
  const mode = String(sortMode || 'alphabetical').trim().toLowerCase();

  // Numeric modes must group by a fixed amount of members so the gallery
  // renders deterministic rows of 5 cards per header.
  if (mode === 'shinies' || mode === 'scoreboard') {
    const sections = [];
    const chunkSize = 5;

    for (let i = 0; i < list.length; i += chunkSize) {
      const chunk = list.slice(i, i + chunkSize);
      if (!chunk.length) continue;

      const values = chunk.map(m => {
        if (mode === 'shinies') return Number(m && m.shinyCount) || 0;
        return Number(m && m.points) || 0;
      });

      const min = Math.min(...values);
      const max = Math.max(...values);

      const title = (min === max)
        ? String(min)
        : `${Math.min(min, max)}-${Math.max(min, max)}`;

      sections.push({ title, entries: chunk });
    }

    return sections;
  }

  const sections = [];
  let currentTitle = null;
  let current = null;

  list.forEach(m => {
    let title = '';

    title = alphaBucketTitle(m && m.name);

    if (title !== currentTitle) {
      currentTitle = title;
      current = { title, entries: [] };
      sections.push(current);
    }

    current.entries.push(m);
  });

  return sections;
}

export function buildMemberGalleryCardView(member, sortMode) {
  const name = member && member.name ? String(member.name) : '';
  const key = member && member.key ? String(member.key) : '';

  return {
    memberKey: key,
    name,
    points: Number(member && member.points) || 0,
    shinyCount: Number(member && member.shinyCount) || 0,
    tierEmblemSrc: getMemberRoleEmblemSrc(member && member.role),
    spriteSrc: getMemberSpriteSrc(key, member && member.sprite),
    sortMode
  };
}

function normalizePokemonKey(raw) {
  return String(raw || '').trim().toLowerCase();
}

function normalizeQuery(raw) {
  return String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');
}

export function isInactiveShiny(s) {
  return Boolean(s && (s.run || s.lost || s.sold));
}

export function classifyShinyVariant(s) {
  return {
    secret: Boolean(s && s.secret),
    alpha: Boolean(s && s.alpha),
    safari: Boolean(s && s.safari === true)
  };
}

export function matchesVariantFilter(s, variantFilter) {
  const v = String(variantFilter || 'any').trim().toLowerCase();
  if (!v || v === 'any') return true;

  const flags = classifyShinyVariant(s);

  if (v === 'secret') return flags.secret;
  if (v === 'alpha') return flags.alpha;
  if (v === 'safari') return flags.safari;
  if (v === 'standard') return !flags.secret && !flags.alpha && !flags.safari;

  return true;
}

export function filterMemberShinies(shinies, { search, status, variant } = {}) {
  const list = Array.isArray(shinies) ? shinies : [];

  const q = normalizeQuery(search);
  const st = String(status || 'active').trim().toLowerCase();

  return list
    .filter(s => {
      if (st === 'inactive') return isInactiveShiny(s);
      if (st === 'all') return true;
      return !isInactiveShiny(s);
    })
    .filter(s => matchesVariantFilter(s, variant))
    .filter(s => {
      if (!q) return true;
      const key = normalizeQuery(normalizePokemonKey(s && s.pokemon));
      return key.includes(q);
    });
}

export function sortMemberShinies(shinies, sortMode, { dexIndex, pointsMap } = {}) {
  const list = Array.isArray(shinies) ? [...shinies] : [];
  const mode = String(sortMode || 'newest').trim().toLowerCase();

  if (mode === 'newest') {
    return list.sort((a, b) => (Number(b.__idx) || 0) - (Number(a.__idx) || 0));
  }

  if (mode === 'points') {
    return list.sort((a, b) => {
      const ak = normalizePokemonKey(a && a.pokemon);
      const bk = normalizePokemonKey(b && b.pokemon);
      const ap = Number(pointsMap && pointsMap[ak]) || 0;
      const bp = Number(pointsMap && pointsMap[bk]) || 0;
      if (bp !== ap) return bp - ap;
      return (Number(a.__idx) || 0) - (Number(b.__idx) || 0);
    });
  }

  if (mode === 'dex') {
    return list.sort((a, b) => {
      const ak = normalizePokemonKey(a && a.pokemon);
      const bk = normalizePokemonKey(b && b.pokemon);
      const ai = (dexIndex && dexIndex[ak] != null) ? dexIndex[ak] : 999999;
      const bi = (dexIndex && dexIndex[bk] != null) ? dexIndex[bk] : 999999;
      if (ai !== bi) return ai - bi;
      return (Number(a.__idx) || 0) - (Number(b.__idx) || 0);
    });
  }

  if (mode === 'az') {
    return list.sort((a, b) => {
      const ak = normalizePokemonKey(a && a.pokemon);
      const bk = normalizePokemonKey(b && b.pokemon);
      const c = ak.localeCompare(bk);
      if (c) return c;
      return (Number(a.__idx) || 0) - (Number(b.__idx) || 0);
    });
  }

  return list;
}

export function buildMemberShinyCounts(shinies) {
  const list = Array.isArray(shinies) ? shinies : [];

  const counts = {
    total: list.length,
    active: 0,
    inactive: 0,
    lost: 0,
    sold: 0,
    run: 0,
    secret: 0,
    alpha: 0,
    safari: 0
  };

  list.forEach(s => {
    const inactive = isInactiveShiny(s);
    if (inactive) counts.inactive += 1;
    else counts.active += 1;

    if (s && s.lost) counts.lost += 1;
    if (s && s.sold) counts.sold += 1;
    if (s && s.run) counts.run += 1;

    const v = classifyShinyVariant(s);
    if (v.secret) counts.secret += 1;
    if (v.alpha) counts.alpha += 1;
    if (v.safari) counts.safari += 1;
  });

  return counts;
}

export function groupMemberShiniesByStatus(shinies) {
  const list = Array.isArray(shinies) ? shinies : [];

  const active = [];
  const lost = [];
  const sold = [];
  const run = [];

  list.forEach(s => {
    if (!s) return;
    if (s.sold) sold.push(s);
    else if (s.lost) lost.push(s);
    else if (s.run) run.push(s);
    else active.push(s);
  });

  return {
    active,
    lost,
    sold,
    run
  };
}
