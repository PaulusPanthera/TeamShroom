// src/features/showcase/showcase.presenter.js
// v2.0.0-beta
// Showcase presenter (sorting + filtering + view shapes)

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

function tierEmblemForRole(role) {
  const r = normalize(role);
  if (r === 'spore') return 'img/symbols/sporesprite.png';
  if (r === 'shroom') return 'img/symbols/shroomsprite.png';
  if (r === 'shinyshroom') return 'img/symbols/shinyshroomsprite.png';
  return 'img/symbols/shroomsprite.png';
}

function spriteSrcForMember(member) {
  const key = member && member.key ? String(member.key) : '';
  const ext = member && member.sprite ? String(member.sprite) : '';
  if (key && ext) return `img/membersprites/${key}sprite.${ext}`;
  return 'img/membersprites/examplesprite.png';
}

export function buildMemberGalleryCardView(member, sortMode) {
  const name = member && member.name ? String(member.name) : '';
  const key = member && member.key ? String(member.key) : '';

  return {
    memberKey: key,
    name,
    points: Number(member && member.points) || 0,
    tierEmblemSrc: tierEmblemForRole(member && member.role),
    spriteSrc: spriteSrcForMember(member),
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
