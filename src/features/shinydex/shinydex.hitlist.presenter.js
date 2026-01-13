// v2.0.0-alpha.1
// src/features/shinydex/shinydex.search.js
// ShinyDex Search — parsing + matching (no DOM)

import { prettifyPokemonName } from '../../utils/utils.js';

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .trim()
    .replace(/[_]/g, ' ')
    .replace(/[-]/g, ' ')
    .replace(/[^a-z0-9\s♀♂.]/g, '')
    .replace(/\s+/g, ' ');
}

function splitTokens(raw) {
  const s = String(raw || '').trim();
  if (!s) return [];
  return s.split(/\s+/).filter(Boolean);
}

/**
 * parseSearch(raw)
 *
 * Supported:
 * - species: default, or "pokemon:<q>" / "p:<q>"
 * - family: "+<q>" or "<q>+" or "family:<q>" / "f:<q>"
 * - member: "@<q>" or "member:<q>" / "m:<q>"
 * - region filter: "r:<q>" / "region:<q>" (prefix match; r:k r:kan r:uno)
 * - tier filter: "tier:<0-6|lm>" / "t:<0-6|lm>"
 * - flags: "unclaimed|unowned" and "claimed|owned"
 */
export function parseSearch(raw) {
  const tokens = splitTokens(raw);

  const out = {
    raw: String(raw || ''),
    kind: 'species', // 'species' | 'family' | 'member'
    q: '',
    filters: {
      region: null,
      tier: null
    },
    flags: {
      unclaimed: false,
      claimed: false
    }
  };

  if (!tokens.length) return out;

  // Single-string shortcuts (+family / @member / trailing +)
  const whole = String(raw || '').trim();
  if (whole.startsWith('+')) {
    out.kind = 'family';
    out.q = norm(whole.slice(1));
  } else if (whole.endsWith('+')) {
    out.kind = 'family';
    out.q = norm(whole.slice(0, -1));
  } else if (whole.startsWith('@')) {
    out.kind = 'member';
    out.q = norm(whole.slice(1));
  }

  // Token parsing (can override kind/q)
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    const lower = t.toLowerCase();

    // flags
    if (lower === 'unclaimed' || lower === 'unowned') out.flags.unclaimed = true;
    if (lower === 'claimed' || lower === 'owned') out.flags.claimed = true;

    // region filter
    if (lower.startsWith('r:') || lower.startsWith('region:')) {
      const v = lower.includes(':') ? lower.split(':').slice(1).join(':') : '';
      out.filters.region = norm(v);
      continue;
    }

    // tier filter
    if (lower.startsWith('t:') || lower.startsWith('tier:')) {
      const v = lower.includes(':') ? lower.split(':').slice(1).join(':') : '';
      const tv = norm(v).replace(/^tier\s*/g, '');
      if (tv === 'lm' || /^[0-6]$/.test(tv)) out.filters.tier = tv;
      continue;
    }

    // explicit kind selectors
    if (lower.startsWith('pokemon:') || lower.startsWith('p:')) {
      const v = lower.split(':').slice(1).join(':');
      out.kind = 'species';
      out.q = norm(v);
      continue;
    }

    if (lower.startsWith('family:') || lower.startsWith('f:')) {
      const v = lower.split(':').slice(1).join(':');
      out.kind = 'family';
      out.q = norm(v);
      continue;
    }

    if (lower.startsWith('member:') || lower.startsWith('m:')) {
      const v = lower.split(':').slice(1).join(':');
      out.kind = 'member';
      out.q = norm(v);
      continue;
    }

    // if no explicit q picked yet, use remaining words as default species query
    if (!out.q && out.kind === 'species' && !lower.includes(':') && !lower.startsWith('+') && !lower.startsWith('@')) {
      out.q = norm(tokens.join(' '));
    }
  }

  return out;
}

export function speciesMatches(pokemonKey, query) {
  const q = norm(query);
  if (!q) return true;

  const display = norm(prettifyPokemonName(pokemonKey));
  const key = norm(pokemonKey);

  // forgiving: match either display or raw key
  return display.includes(q) || key.includes(q);
}

export function memberMatches(memberName, query) {
  const q = norm(query);
  if (!q) return true;
  const name = norm(memberName);
  return name.includes(q);
}

/**
 * searchCtx contract (built in controller):
 * {
 *   rootByPokemon: { [pokemonKey]: rootKey },
 *   familyRoots: string[],
 *   displayByPokemon: { [pokemonKey]: string } // normalized display
 * }
 */
export function resolveFamilyRootsByQuery(searchCtx, query) {
  const q = norm(query);
  const roots = Array.isArray(searchCtx?.familyRoots) ? searchCtx.familyRoots : [];
  const displayByPokemon = searchCtx?.displayByPokemon || {};

  // empty family query => no filtering (all roots)
  if (!q) return new Set(roots);

  const out = new Set();
  for (let i = 0; i < roots.length; i++) {
    const root = roots[i];
    const d = displayByPokemon[root] || norm(prettifyPokemonName(root));
    if (d.includes(q)) out.add(root);
  }
  return out;
}
