// v2.0.0-alpha.1
// src/features/shinydex/shinydex.search.js
// Search parsing + match helpers (runtime-only, forgiving)

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[_/]+/g, ' ')
    .replace(/[^a-z0-9\s-]/g, '')   // keep hyphen
    .replace(/\s+/g, ' ')
    .trim();
}

function stripToken(src, re) {
  return String(src || '').replace(re, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * parseSearch(input)
 *
 * Supported:
 * - Species: "pik", "mr mime", "p:eevee", "pokemon:eevee"
 * - Family:  "+pika", "pika+", "family:pika", "family: pika"
 * - Member:  "@paulus", "member: paulus"
 * - Region:  "r:k", "r:kan", "region:kanto"  (prefix match)
 * - Tier:    "t:0", "t:1", "t:2", "t:lm", "tier:lm"
 * - Flags:   "unclaimed/unowned", "claimed/owned"
 */
export function parseSearch(input) {
  var raw = String(input || '').trim();
  var s = raw;

  var filters = {};
  var flags = { unclaimed: false, claimed: false };

  // region token
  var mR = s.match(/(?:^|\s)(?:r|region)\s*:\s*([a-z0-9-]+)/i);
  if (mR && mR[1]) {
    filters.region = mR[1];
    s = stripToken(s, /(?:^|\s)(?:r|region)\s*:\s*[a-z0-9-]+/ig);
  }

  // tier token
  var mT = s.match(/(?:^|\s)(?:t|tier)\s*:?\s*(lm|[0-6])\b/i);
  if (mT && mT[1]) {
    filters.tier = String(mT[1]).toLowerCase();
    s = stripToken(s, /(?:^|\s)(?:t|tier)\s*:?\s*(?:lm|[0-6])\b/ig);
  }

  // flags (can appear anywhere)
  if (/\b(unclaimed|unowned)\b/i.test(s)) {
    flags.unclaimed = true;
    s = stripToken(s, /\b(unclaimed|unowned)\b/ig);
  }
  if (/\b(claimed|owned)\b/i.test(s)) {
    flags.claimed = true;
    s = stripToken(s, /\b(claimed|owned)\b/ig);
  }

  s = String(s || '').trim();

  // member query
  if (s[0] === '@') {
    return { kind: 'member', q: norm(s.slice(1)), filters: filters, flags: flags, raw: raw };
  }
  var mMember = s.match(/^(?:member)\s*:\s*(.+)$/i);
  if (mMember && mMember[1] != null) {
    return { kind: 'member', q: norm(mMember[1]), filters: filters, flags: flags, raw: raw };
  }

  // family query
  if (s[0] === '+') {
    return { kind: 'family', q: norm(s.slice(1)), filters: filters, flags: flags, raw: raw };
  }
  if (s.length && s[s.length - 1] === '+') {
    return { kind: 'family', q: norm(s.slice(0, -1)), filters: filters, flags: flags, raw: raw };
  }
  var mFam = s.match(/^(?:family)\s*:\s*(.+)$/i);
  if (mFam && mFam[1] != null) {
    return { kind: 'family', q: norm(mFam[1]), filters: filters, flags: flags, raw: raw };
  }

  // explicit species prefix
  var mP = s.match(/^(?:p|pokemon)\s*:\s*(.+)$/i);
  if (mP && mP[1] != null) {
    return { kind: 'species', q: norm(mP[1]), filters: filters, flags: flags, raw: raw };
  }

  // default species
  return { kind: 'species', q: norm(s), filters: filters, flags: flags, raw: raw };
}

export function memberMatches(name, q) {
  if (!q) return true;
  return norm(name).indexOf(norm(q)) !== -1;
}

export function speciesMatches(pokemonKey, q) {
  if (!q) return true;
  var key = norm(pokemonKey).replace(/-/g, ' ');
  var qq = norm(q);

  // also allow matching against hyphenless/space-less
  var compactKey = key.replace(/\s+/g, '');
  var compactQ = qq.replace(/\s+/g, '');

  return key.indexOf(qq) !== -1 || compactKey.indexOf(compactQ) !== -1;
}

/**
 * resolveFamilyRootsByQuery(searchCtx, q)
 * - q can match ANY member inside a family (not just the root)
 * - returns Set<root>
 */
export function resolveFamilyRootsByQuery(searchCtx, q) {
  var set = new Set();
  var qq = norm(q);
  if (!qq) return set;

  if (!searchCtx || !searchCtx.familyMembersByRoot) return set;

  Object.keys(searchCtx.familyMembersByRoot).forEach(function (root) {
    var members = searchCtx.familyMembersByRoot[root] || [];
    for (var i = 0; i < members.length; i++) {
      if (speciesMatches(members[i], qq)) {
        set.add(root);
        return;
      }
    }
    // also allow matching root name itself
    if (speciesMatches(root, qq)) set.add(root);
  });

  return set;
}
