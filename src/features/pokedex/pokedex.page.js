// src/features/pokedex/pokedex.page.js
// v2.0.0-beta
// Shiny Pokédex page shell
// Owns:
// - data load + handoff (via domain layer)
// - view deep-linking (#hitlist/living)
// - URL sync on view tab clicks (no rerender loop)
//
// Does NOT own:
// - ShinyDex internal semantics, variant ownership rules, or status filtering

import { getPokedexDeps } from '../../domains/pokedex/pokedex.data.js';
import { mountShinyPokedex } from './pokedex.adapter.js';
import {
  parsePokedexHash,
  getCanonicalPokedexHash,
  replaceHashSilently
} from './pokedex.route.js';

let activeController = null;

function teardownActiveListeners() {
  if (!activeController) return;
  try {
    activeController.abort();
  } catch {
    // ignore
  }
  activeController = null;
}

function bindViewUrlSync(root, signal) {
  if (!root) return;

  const tabHitlist = root.querySelector('#tab-hitlist');
  const tabLiving = root.querySelector('#tab-living');

  // Sync URL to match in-page view switching.
  tabHitlist?.addEventListener(
    'click',
    () => replaceHashSilently(getCanonicalPokedexHash('hitlist')),
    { signal }
  );

  tabLiving?.addEventListener(
    'click',
    () => replaceHashSilently(getCanonicalPokedexHash('living')),
    { signal }
  );
}

function applyInitialView(root, view) {
  const v = String(view || '').toLowerCase();
  if (v !== 'living') return;

  // ShinyDex boots in hitlist view.
  // Switching via click preserves feature-owned state transitions.
  const livingTab = root.querySelector('#tab-living');
  if (livingTab && typeof livingTab.click === 'function') livingTab.click();
}

export async function renderPokedexPage({ view } = {}) {
  const root = document.getElementById('page-content');
  if (!root) return;

  teardownActiveListeners();
  activeController = new AbortController();

  const route = parsePokedexHash(location.hash);
  const initialView = view || route.view || 'hitlist';

  // Canonicalize hash early to keep shareable URLs stable.
  const canonicalHash = getCanonicalPokedexHash(initialView);
  const currentNormalized = String(location.hash || '')
    .toLowerCase()
    .replace(/^#pokedex\b/, '#hitlist');
  if (currentNormalized !== canonicalHash) {
    replaceHashSilently(canonicalHash);
  }

  const deps = await getPokedexDeps();

  mountShinyPokedex(deps);

  bindViewUrlSync(root, activeController.signal);
  applyInitialView(root, initialView);
}
