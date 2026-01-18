// src/app/render.js
// v2.0.0-beta
// Page render orchestration (routes + shell + feature setup)

import {
  initPokemonDerivedDataOnce,
  getPokemonPointsMap
} from '../domains/pokemon/pokemon.data.js';

import { renderPokedexPage } from '../features/pokedex/pokedex.page.js';
import { renderHomePage } from '../features/home/home.page.js';
import { renderShowcasePage } from '../features/showcase/showcase.js';
import { renderDonatorsPage } from '../features/donators/donators.page.js';
import { renderShinyWeeklyPage } from '../features/shinyweekly/shinyweekly.page.js';

import {
  ensureShell,
  ensureHeader,
  updateHeaderHeightVar,
  setHeaderMeta,
  resetHeaderMeta,
  configureCollectButton,
  resetCollectButton
} from './shell.js';

import { createSidebarController } from './sidebar.js';
import { getRoute, setActiveNav } from './routes.js';

import {
  getShowcaseRows,
  getMembersRows,
  getDonatorsRows,
  getWeeklyModel
} from './cache.js';

/* ---------------------------------------------------------
   BOOTSTRAP
--------------------------------------------------------- */

ensureShell();
ensureHeader();
updateHeaderHeightVar();

/* ---------------------------------------------------------
   ROUTE LIFECYCLE
--------------------------------------------------------- */

let activeRouteToken = 0;
let activeRouteController = null;
let activeDispose = null;

function beginRouteLifecycle() {
  activeRouteToken += 1;
  const token = activeRouteToken;

  // Dispose previous feature instance.
  if (typeof activeDispose === 'function') {
    try {
      activeDispose();
    } catch {
      // ignore
    }
  }
  activeDispose = null;

  // Cancel previous route async work.
  if (activeRouteController) {
    try {
      activeRouteController.abort();
    } catch {
      // ignore
    }
  }

  activeRouteController = new AbortController();

  return { token, signal: activeRouteController.signal };
}

/* ---------------------------------------------------------
   PAGE RENDER
--------------------------------------------------------- */

async function ensurePokemonData() {
  await initPokemonDerivedDataOnce();
}

function showRouteLoading(containerEl, label) {
  if (!containerEl) return null;

  const wrap = document.createElement('div');
  wrap.setAttribute('data-route-loading', '1');
  wrap.className = 'ts-panel';

  const title = document.createElement('div');
  title.textContent = `Loading ${label}...`;

  wrap.appendChild(title);
  containerEl.replaceChildren(wrap);

  return wrap;
}

function showRouteError(containerEl, label, err) {
  if (!containerEl) return;

  const wrap = document.createElement('div');
  wrap.setAttribute('data-route-error', '1');
  wrap.className = 'ts-panel';

  const title = document.createElement('div');
  title.textContent = `Failed to load ${label}.`;

  const details = document.createElement('pre');
  details.textContent = String(err?.message || err || 'Unknown error');

  const retry = document.createElement('button');
  retry.type = 'button';
  retry.textContent = 'Retry';
  retry.addEventListener('click', () => renderPage());

  wrap.append(title, details, retry);
  containerEl.replaceChildren(wrap);
}

async function mountFeaturePage({ containerEl, label, token, renderFn }) {
  const loadingEl = showRouteLoading(containerEl, label);

  try {
    const maybeDispose = await Promise.resolve(renderFn());

    // Stale completion: do nothing.
    if (token !== activeRouteToken) return;

    if (loadingEl?.isConnected) loadingEl.remove();

    if (typeof maybeDispose === 'function') {
      activeDispose = maybeDispose;
    }
  } catch (err) {
    if (token !== activeRouteToken) return;
    showRouteError(containerEl, label, err);
  }
}

export async function renderPage() {
  ensureShell();
  ensureHeader();
  updateHeaderHeightVar();

  // Deterministic header meta per-route.
  resetHeaderMeta();

  // Features may temporarily configure the shell-owned COLLECT button.
  // Reset per-route so behavior remains global + consistent.
  resetCollectButton();

  const collect = {
    configure: configureCollectButton,
    reset: resetCollectButton
  };

  const { token, signal } = beginRouteLifecycle();

  const route = getRoute();

  setActiveNav(route.page);
  const sidebar = createSidebarController(route.page);

  // Header title + one-line description (quest-log strip).
  const headerMeta = (() => {
    if (route.page === 'home') return { title: 'HOME', desc: 'Guild HQ overview.' };
    if (route.page === 'showcase') return { title: 'MEMBER', desc: 'Browse guild members.' };
    if (route.page === 'shinyweekly') return { title: 'WEEKLY', desc: 'Open a week to view details.' };
    if (route.page === 'donators') return { title: 'DONATORS', desc: 'Supporters of Team Shroom.' };
    return { title: 'POKÉDEX', desc: 'Hitlist & LivingDex progress.' };
  })();

  setHeaderMeta(headerMeta);

  const content = document.getElementById('page-content');
  if (content) content.replaceChildren();

  if (route.page === 'home') {
    await mountFeaturePage({
      containerEl: content,
      label: 'Home',
      token,
      renderFn: async () => {
        return renderHomePage({
          root: content,
          sidebar,
          signal,
          collect,
          params: {}
        });
      }
    });

    if (token !== activeRouteToken) return;
    return;
  }

  if (route.page === 'donators') {
    await mountFeaturePage({
      containerEl: content,
      label: 'Donators',
      token,
      renderFn: async () => {
        const rows = await getDonatorsRows();
        return renderDonatorsPage({
          root: content,
          sidebar,
          signal,
          collect,
          params: { rows }
        });
      }
    });

    if (token !== activeRouteToken) return;
    return;
  }

  if (route.page === 'showcase') {
    await mountFeaturePage({
      containerEl: content,
      label: 'Showcase',
      token,
      renderFn: async () => {
        await ensurePokemonData();

        const [showcaseRows, membersRows] = await Promise.all([
          getShowcaseRows(),
          getMembersRows()
        ]);

        await Promise.resolve(
          renderShowcasePage({
            root: content,
            sidebar,
            signal,
            collect,
            params: {
              membersRows,
              showcaseRows,
              pokemonPoints: getPokemonPointsMap()
            }
          })
        );
      }
    });

    if (token !== activeRouteToken) return;
    return;
  }

  if (route.page === 'shinyweekly') {
    await mountFeaturePage({
      containerEl: content,
      label: 'ShinyWeekly',
      token,
      // IMPORTANT: pass the page-content root so the main panel is deterministic
      renderFn: async () => {
        const rows = await getWeeklyModel();
        return renderShinyWeeklyPage({
          root: content,
          sidebar,
          signal,
          collect,
          params: { rows }
        });
      }
    });

    if (token !== activeRouteToken) return;
    return;
  }

  // ShinyDex (Hitlist / LivingDex)
  await mountFeaturePage({
    containerEl: content,
    label: 'Pokedex',
    token,
    renderFn: () => renderPokedexPage({ root: content, sidebar, signal, collect })
  });

  if (token !== activeRouteToken) return;
}
