// src/features/pokedex/pokedex.route.js
// v2.0.0-beta
// Shiny Pokédex route parsing + canonicalization

export const POKEDEX_HASH_BASE = '#hitlist';

/**
 * Supported formats:
 *   #hitlist
 *   #hitlist/living
 *   #pokedex
 *   #pokedex/living
 *   #hitlist?view=living
 *   #pokedex?view=living
 */
export function parsePokedexHash(hash) {
  const raw = String(hash || '').trim();
  const lower = raw.toLowerCase();

  const route = {
    page: 'hitlist',
    view: 'hitlist'
  };

  if (!lower || lower === '#') return route;

  // Normalize base alias.
  const normalized = lower.replace(/^#pokedex\b/, POKEDEX_HASH_BASE);

  // Split path + query.
  const qIndex = normalized.indexOf('?');
  const path = (qIndex >= 0 ? normalized.slice(0, qIndex) : normalized)
    .split('/')
    .filter(Boolean);
  const query = qIndex >= 0 ? normalized.slice(qIndex + 1) : '';

  // Path-based view (#hitlist/living)
  // path[0] is '#hitlist'
  const viewFromPath = path.length >= 2 ? String(path[1] || '') : '';
  if (viewFromPath === 'living') route.view = 'living';

  // Query-based view (#hitlist?view=living)
  if (query) {
    try {
      const params = new URLSearchParams(query);
      const v = String(params.get('view') || '').toLowerCase();
      if (v === 'living') route.view = 'living';
    } catch {
      // ignore
    }
  }

  return route;
}

export function getCanonicalPokedexHash(view) {
  const v = String(view || '').toLowerCase();
  if (v === 'living') return `${POKEDEX_HASH_BASE}/living`;
  return POKEDEX_HASH_BASE;
}

/**
 * Updates the hash without triggering hashchange.
 * Used to keep shareable URLs in sync with in-page view switching.
 */
export function replaceHashSilently(nextHash) {
  const h = String(nextHash || '').trim();
  if (!h.startsWith('#')) return;

  if (location.hash === h) return;

  try {
    history.replaceState(null, '', h);
  } catch {
    // Fallback triggers hashchange.
    location.hash = h;
  }
}
