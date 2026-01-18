// src/features/shinyweekly/shinyweekly.page.js
// v2.0.0-beta
// ShinyWeekly page entry. Loads weekly model and renders overview + week detail views inside the feature mount.

import { loadShinyWeekly } from '../../data/shinyweekly.loader.js';
import { buildShinyWeeklyModel } from '../../domains/shinyweekly/shinyweekly.model.js';
import { initPokemonDerivedDataOnce, getPokemonPointsMap } from '../../domains/pokemon/pokemon.data.js';

import {
  renderWeeklyShell,
  renderLoading,
  renderError,
  renderEmptyState,
  renderOverview,
  renderWeekView
} from './shinyweekly.ui.js';

function assertValidRoot(root) {
  if (!root || !(root instanceof Element)) {
    throw new Error('SHINYWEEKLY_INVALID_ROOT');
  }
}

function safeDateMs(raw) {
  const ms = Date.parse(String(raw || ''));
  return Number.isFinite(ms) ? ms : 0;
}

function getDefaultWeekKey(weeks) {
  const list = Array.isArray(weeks) ? weeks : [];
  if (!list.length) return '';

  // Deterministic: pick the week with the latest dateEnd/dateStart.
  // Do not rely on sheet row order, which can be user-sorted.
  let best = list[0];
  let bestScore = 0;

  list.forEach((w) => {
    const end = safeDateMs(w && w.dateEnd);
    const start = safeDateMs(w && w.dateStart);
    const score = end || start;
    if (score > bestScore) {
      best = w;
      bestScore = score;
      return;
    }

    // Tie-breaker: stable lexicographic week key
    if (score === bestScore) {
      const a = String(w && w.week || '');
      const b = String(best && best.week || '');
      if (a.localeCompare(b) > 0) best = w;
    }
  });

  return String(best && best.week || '').trim();
}

export async function renderShinyWeeklyPage(ctx) {
  const root = ctx && ctx.root;
  const sidebar = ctx && ctx.sidebar;
  const signal = ctx && ctx.signal;
  const preloadedRows = ctx && ctx.params && ctx.params.rows;
  assertValidRoot(root);

  const { mainBody } = renderWeeklyShell(root);
  renderLoading(mainBody);

  const weeklyHint = document.createElement('div');
  weeklyHint.className = 'ts-subbar-stats';
  weeklyHint.textContent = "Open a week to view details.";

  const info = document.createElement('div');
  info.className = 'ts-subbar-stats';
  info.textContent = 'Click a card to cycle shinies.';

  if (sidebar && typeof sidebar.setSections === 'function') {
    sidebar.setSections([
      { label: 'WEEKLY LOG', node: weeklyHint },
      { label: 'Info', node: info }
    ]);
  }

  try {
    const rows = Array.isArray(preloadedRows) ? preloadedRows : await loadShinyWeekly();
    const weeks = buildShinyWeeklyModel(rows);

    if (!weeks.length) {
      renderEmptyState(mainBody, {
        title: 'No weekly data yet',
        message: 'There are no weeks available to display.'
      });
      return;
    }

    // Default to the latest week after load (deterministic by date).
    // Even when we render the overview first, we keep this selection stable
    // for highlighting and deterministic behavior.
    let view = 'overview';
    let selectedWeekKey = getDefaultWeekKey(weeks);

    // Weekly needs Pokémon points to resolve tier trim + header points chip.
    // Load derived Pokémon data locally to avoid global route coupling.
    let pokemonReady = false;
    let pokemonPointsMap = {};

    const commitRender = () => {
      if (view === 'overview') {
        renderOverview(
          mainBody,
          {
            weeks,
            selectedWeekKey,
            onSelectWeek: (weekKey) => {
              selectedWeekKey = String(weekKey || '');
              view = 'week';
              commitRender();
            }
          },
          { signal }
        );
        return;
      }

      const week = weeks.find(w => w.week === selectedWeekKey) || null;

      if (!pokemonReady) {
        renderLoading(mainBody, { message: 'Loading Pokémon data...' });
        return;
      }

      renderWeekView(
        mainBody,
        {
          week,
          pokemonPointsMap,
          onBack: () => {
            view = 'overview';
            commitRender();
          }
        },
        { signal }
      );
    };

    Promise.resolve(initPokemonDerivedDataOnce())
      .then(() => {
        pokemonReady = true;
        pokemonPointsMap = getPokemonPointsMap();
        if (view === 'week') commitRender();
      })
      .catch(() => {
        pokemonReady = true;
        pokemonPointsMap = {};
        if (view === 'week') commitRender();
      });

    commitRender();
  } catch {
    renderError(mainBody, 'Failed to load weekly data.');
  }
}
