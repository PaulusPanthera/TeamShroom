// src/features/shinyweekly/shinyweekly.page.js
// v2.0.0-beta
// ShinyWeekly page entry. Loads weekly model and renders overview + week detail views inside the feature mount.

import { loadShinyWeekly } from '../../data/shinyweekly.loader.js';
import { loadMembers } from '../../data/members.loader.js';
import { buildShinyWeeklyModel } from '../../domains/shinyweekly/shinyweekly.model.js';
import { initPokemonDerivedDataOnce, getPokemonPointsMap } from '../../domains/pokemon/pokemon.data.js';
import { normalizeMemberKey } from '../../domains/members/member.assets.js';
import { computeHotwForWeek } from '../../domains/shinyweekly/hotw.ai.js';

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


function makeLines(lines) {
  const wrap = document.createElement('div');
  wrap.className = 'ts-subbar-stats';

  const list = Array.isArray(lines) ? lines : [];
  list.forEach((t) => {
    const line = document.createElement('div');
    line.textContent = String(t || '').trim();
    wrap.appendChild(line);
  });

  return wrap;
}

function setSidebarHeader(sidebar) {
  if (!sidebar) return;

  if (typeof sidebar.setTitle === 'function') {
    sidebar.setTitle('WEEKLY LOG');
  }

  if (typeof sidebar.setHint === 'function') {
    sidebar.setHint('Team history. Weekly overview with hunter cards and shiny drops.');
  }
}

function renderSidebarBlocks(sidebar, week, opts = {}) {
  if (!sidebar || typeof sidebar.setSections !== 'function') return;

  const view = opts && opts.view ? String(opts.view) : 'overview';
  const onBack = opts && typeof opts.onBack === 'function' ? opts.onBack : null;
  const onToggleOverviewLabels = opts && typeof opts.onToggleOverviewLabels === 'function'
    ? opts.onToggleOverviewLabels
    : null;
  const overviewLabelMode = opts && opts.overviewLabelMode ? String(opts.overviewLabelMode) : 'dates';
  const signal = opts && opts.signal;

  const wk = week && typeof week === 'object' ? week : null;

  const label = wk ? String(wk.label || wk.week || '').trim() : '';
  const labelText = label || '—';

  const shinies = wk ? (Number(wk.shinyCount) || 0) : '—';
  const hunters = wk ? (Number(wk.hunterCount) || 0) : '—';

  const statusNode = makeLines([
    `Selected Week: ${labelText}`,
    `Shinies: ${shinies}`,
    `Hunters: ${hunters}`
  ]);

  const controlsWrap = document.createElement('div');
  controlsWrap.className = 'ts-side-content';

  if (view === 'week' && onBack) {
    const backBtn = document.createElement('button');
    backBtn.type = 'button';
    backBtn.className = 'ts-side-action';
    backBtn.textContent = 'Back to Overview';

    backBtn.addEventListener(
      'click',
      () => onBack(),
      signal ? { signal } : undefined
    );

    controlsWrap.appendChild(backBtn);
  }

  if (view === 'overview' && onToggleOverviewLabels) {
    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'ts-side-action';

    const mode = String(overviewLabelMode || 'dates').toLowerCase();
    toggleBtn.textContent = mode === 'hotw' ? 'Show Week Dates' : 'Show Hunter of the Week';

    toggleBtn.addEventListener(
      'click',
      () => onToggleOverviewLabels(),
      signal ? { signal } : undefined
    );

    controlsWrap.appendChild(toggleBtn);
  }

  const controlsNode = makeLines([
    'Select week',
    'Inspect hunters',
    'Cycle shinies',
    'Toggle week tile labels'
  ]);

  controlsWrap.appendChild(controlsNode);

  const notesNode = makeLines([
    'Weeks lock after reset.',
    'Older weeks stay as record.'
  ]);

  sidebar.setSections([
    { label: 'STATUS', node: statusNode },
    { label: 'CONTROLS', node: controlsWrap },
    { label: 'NOTES', node: notesNode }
  ]);
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

  setSidebarHeader(sidebar);
  renderSidebarBlocks(sidebar, null, { view: 'overview', signal });

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

    // Overview label mode:
    // - 'dates' => show week date ranges
    // - 'hotw'  => show Hunter of the Week names
    let overviewLabelMode = 'dates';
    let hotwLabelByWeekKey = Object.create(null);

    // Weekly needs Pokémon points to resolve tier trim + header points chip.
    // Load derived Pokémon data locally to avoid global route coupling.
    let pokemonReady = false;
    let pokemonPointsMap = {};

    // Weekly member cards must respect members.json sprite + role wiring.
    // Load members locally and pass a meta-map into the UI.
    let membersReady = false;
    let memberMetaByKey = Object.create(null);

    const formatHotwLabel = (weekObj, winnerKeys) => {
      const keys = Array.isArray(winnerKeys) ? winnerKeys : [];
      if (!keys.length) return '—';

      const byOt = weekObj && weekObj.membersByOt ? weekObj.membersByOt : null;
      const names = keys
        .map(k => (byOt && byOt[k] && byOt[k].name) ? String(byOt[k].name) : '')
        .filter(Boolean);

      if (!names.length) return '—';
      if (names.length === 1) return names[0];
      return `${names[0]} +${names.length - 1}`;
    };

    const recomputeHotwLabels = () => {
      if (!pokemonReady) return;
      const map = Object.create(null);

      weeks.forEach((w) => {
        const wk = w && typeof w === 'object' ? w : null;
        const weekKey = wk ? String(wk.week || '').trim() : '';
        if (!weekKey) return;

        const winners = computeHotwForWeek(wk, pokemonPointsMap);
        map[weekKey] = formatHotwLabel(wk, winners);
      });

      hotwLabelByWeekKey = map;
    };

    const commitRender = () => {
      const selectedWeek = weeks.find(w => w.week === selectedWeekKey) || null;
      renderSidebarBlocks(sidebar, selectedWeek, {
        view,
        signal,
        overviewLabelMode,
        onBack: () => {
          view = 'overview';
          commitRender();
        },
        onToggleOverviewLabels: () => {
          overviewLabelMode = overviewLabelMode === 'hotw' ? 'dates' : 'hotw';
          if (overviewLabelMode === 'hotw') recomputeHotwLabels();
          commitRender();
        }
      });

      if (view === 'overview') {
        renderOverview(
          mainBody,
          {
            weeks,
            selectedWeekKey,
            labelMode: overviewLabelMode,
            hotwLabelByWeekKey,
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

      const week = selectedWeek;

      if (!pokemonReady || !membersReady) {
        const message = !pokemonReady
          ? 'Loading Pokémon data...'
          : 'Loading member data...';
        renderLoading(mainBody, { message });
        return;
      }

      const hotwKeys = week ? computeHotwForWeek(week, pokemonPointsMap) : [];

      renderWeekView(
        mainBody,
        {
          week,
          pokemonPointsMap,
          memberMetaByKey,
          hotwKeys,
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
        if (overviewLabelMode === 'hotw') recomputeHotwLabels();
        if (view === 'week') commitRender();
      })
      .catch(() => {
        pokemonReady = true;
        pokemonPointsMap = {};
        if (overviewLabelMode === 'hotw') recomputeHotwLabels();
        if (view === 'week') commitRender();
      });

    Promise.resolve(loadMembers())
      .then((rows) => {
        const map = Object.create(null);

        (Array.isArray(rows) ? rows : []).forEach((r) => {
          const key = normalizeMemberKey(r && r.name);
          if (!key) return;

          map[key] = {
            key,
            name: String((r && r.name) || ''),
            role: String((r && r.role) || ''),
            sprite: (r && r.sprite != null) ? String(r.sprite) : null
          };
        });

        memberMetaByKey = map;
        membersReady = true;
        if (view === 'week') commitRender();
      })
      .catch(() => {
        memberMetaByKey = Object.create(null);
        membersReady = true;
        if (view === 'week') commitRender();
      });

    // Clicking the WEEKLY nav while already inside Weekly should always return to overview.
    const navWeekly = document.getElementById('nav-shinyweekly');
    if (navWeekly) {
      navWeekly.addEventListener(
        'click',
        (event) => {
          const hash = String(location.hash || '').trim().toLowerCase();
          if (!hash.startsWith('#shinyweekly')) return;

          // Hash doesn't change, so force an internal reset.
          event.preventDefault();
          view = 'overview';
          commitRender();
        },
        signal ? { signal } : undefined
      );
    }

    commitRender();
  } catch {
    renderError(mainBody, 'Failed to load weekly data.');
  }
}
