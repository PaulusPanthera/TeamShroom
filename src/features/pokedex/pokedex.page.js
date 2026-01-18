// src/features/pokedex/pokedex.page.js
// v2.0.0-beta
// Shiny Pokedex page shell
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

function assertValidRoot(root) {
  if (!root || !(root instanceof Element)) {
    throw new Error('POKEDEX_INVALID_ROOT');
  }
}

function teardownActiveListeners() {
  if (!activeController) return;
  try {
    activeController.abort();
  } catch {
    // ignore
  }
  activeController = null;
}

function bindViewUrlSync(signal) {
  const tabHitlist = document.getElementById('tab-hitlist');
  const tabLiving = document.getElementById('tab-living');

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

function applyInitialView(view) {
  const v = String(view || '').toLowerCase();
  if (v !== 'living') return;

  // ShinyDex boots in hitlist view.
  // Switching via click preserves feature-owned state transitions.
  const livingTab = document.getElementById('tab-living');
  if (livingTab && typeof livingTab.click === 'function') livingTab.click();
}

export async function renderPokedexPage(ctx) {
  const root = ctx && ctx.root;
  const sidebar = ctx && ctx.sidebar;
  const signal = ctx && ctx.signal;
  const view = ctx && ctx.params && ctx.params.view;
  assertValidRoot(root);

  teardownActiveListeners();
  activeController = new AbortController();

  // Allow router-owned signal to cancel this route safely.
  if (signal) {
    try {
      if (signal.aborted) activeController.abort();
      else signal.addEventListener('abort', () => activeController.abort(), { once: true });
    } catch {
      // ignore
    }
  }

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

  const disposeDex = mountShinyPokedex(root, {
    ...deps,
    signal: activeController.signal,
    sidebar
  });

  bindViewUrlSync(activeController.signal);
  applyInitialView(initialView);

  return () => {
    teardownActiveListeners();
    if (typeof disposeDex === 'function') {
      try {
        disposeDex();
      } catch {
        // ignore
      }
    }
  };
}
