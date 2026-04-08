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
  const overviewMode = opts && opts.overviewMode ? String(opts.overviewMode) : 'standard';
  const onSetOverviewMode = opts && typeof opts.onSetOverviewMode === 'function'
    ? opts.onSetOverviewMode
    : null;
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

  if (view === 'overview' && onSetOverviewMode) {
    const select = document.createElement('select');
    select.className = 'ts-side-select';

    const options = [
      { value: 'standard', label: 'Standard' },
      { value: 'hotw', label: 'HOTW' },
      { value: 'tophotw', label: 'Top HOTW' }
    ];

    options.forEach((o) => {
      const opt = document.createElement('option');
      opt.value = o.value;
      opt.textContent = o.label;
      select.appendChild(opt);
    });

    select.value = String(overviewMode || 'standard').toLowerCase();

    select.addEventListener(
      'change',
      () => onSetOverviewMode(select.value),
      signal ? { signal } : undefined
    );

    controlsWrap.appendChild(select);
  }

  const controlsNode = makeLines([
    'Select week',
    'Inspect hunters',
    'Cycle shinies',
    'Switch view mode'
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
  const isActive = typeof (ctx && ctx.isActive) === 'function' ? ctx.isActive : () => true;
  assertValidRoot(root);

  const { mainBody } = renderWeeklyShell(root);
  renderLoading(mainBody);

  setSidebarHeader(sidebar);
  renderSidebarBlocks(sidebar, null, { view: 'overview', signal });

  try {
    const rows = Array.isArray(preloadedRows) ? preloadedRows : await loadShinyWeekly();
    const weeks = buildShinyWeeklyModel(rows);

    if (!isActive()) return;

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

    // Overview view mode:
    // - 'standard' => default week date labels
    // - 'hotw'     => show Hunter of the Week names
    // - 'tophotw'  => leaderboard-style overview grouped by HOTW winner
    let overviewMode = 'standard';
    let hotwLabelByWeekKey = Object.create(null);
    let topHotwGroups = [];

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

    const recomputeTopHotwGroups = () => {
      if (!pokemonReady) return;

      const ordered = weeks.slice();
      ordered.sort((a, b) => {
        const aScore = safeDateMs(a && a.dateEnd) || safeDateMs(a && a.dateStart);
        const bScore = safeDateMs(b && b.dateEnd) || safeDateMs(b && b.dateStart);
        if (aScore !== bScore) return bScore - aScore;
        return String((b && b.week) || '').localeCompare(String((a && a.week) || ''));
      });

      const byKey = Object.create(null);

      ordered.forEach((w) => {
        const wk = w && typeof w === 'object' ? w : null;
        const weekKey = wk ? String(wk.week || '').trim() : '';
        if (!weekKey) return;

        const winners = computeHotwForWeek(wk, pokemonPointsMap);

        (Array.isArray(winners) ? winners : []).forEach((winnerKeyRaw) => {
          const winnerKey = normalizeMemberKey(winnerKeyRaw);
          if (!winnerKey) return;

          if (!byKey[winnerKey]) {
            const byOt = wk.membersByOt && typeof wk.membersByOt === 'object' ? wk.membersByOt : null;
            const fallbackName = byOt && byOt[winnerKey] && byOt[winnerKey].name
              ? String(byOt[winnerKey].name)
              : winnerKey;

            byKey[winnerKey] = {
              winnerKey,
              name: fallbackName,
              seenWeeks: new Set(),
              weeks: []
            };
          }

          const group = byKey[winnerKey];
          if (group.seenWeeks.has(weekKey)) return;
          group.seenWeeks.add(weekKey);
          group.weeks.push(wk);
        });
      });

      const groups = Object.values(byKey).map((g) => {
        const count = g.weeks.length;
        const title = `${g.name} (${count})`;
        return { title, weeks: g.weeks };
      });

      groups.sort((a, b) => {
        const ac = Array.isArray(a.weeks) ? a.weeks.length : 0;
        const bc = Array.isArray(b.weeks) ? b.weeks.length : 0;
        if (ac !== bc) return bc - ac;
        return String(a.title).localeCompare(String(b.title));
      });

      topHotwGroups = groups;
    };

    const setOverviewMode = (nextMode) => {
      if (!isActive()) return;
      const mode = String(nextMode || '').trim().toLowerCase();
      if (mode !== 'standard' && mode !== 'hotw' && mode !== 'tophotw') return;

      overviewMode = mode;
      if (overviewMode === 'hotw') recomputeHotwLabels();
      if (overviewMode === 'tophotw') recomputeTopHotwGroups();
      commitRender();
    };

    const commitRender = () => {
      if (!isActive()) return;
      const selectedWeek = weeks.find(w => w.week === selectedWeekKey) || null;
      renderSidebarBlocks(sidebar, selectedWeek, {
        view,
        signal,
        overviewMode,
        onBack: () => {
          view = 'overview';
          commitRender();
        },
        onSetOverviewMode: (mode) => setOverviewMode(mode)
      });

      if (view === 'overview') {
        const labelMode = overviewMode === 'hotw'
          ? 'hotw'
          : (overviewMode === 'tophotw' ? 'tophotw' : 'dates');

        renderOverview(
          mainBody,
          {
            weeks,
            selectedWeekKey,
            labelMode,
            hotwLabelByWeekKey,
            topHotwGroups,
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
        if (overviewMode === 'hotw') recomputeHotwLabels();
        if (overviewMode === 'tophotw') recomputeTopHotwGroups();
        if (view === 'week' && isActive()) commitRender();
      })
      .catch(() => {
        pokemonReady = true;
        pokemonPointsMap = {};
        if (overviewMode === 'hotw') recomputeHotwLabels();
        if (overviewMode === 'tophotw') recomputeTopHotwGroups();
        if (view === 'week' && isActive()) commitRender();
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
        if (view === 'week' && isActive()) commitRender();
      })
      .catch(() => {
        memberMetaByKey = Object.create(null);
        membersReady = true;
        if (view === 'week' && isActive()) commitRender();
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

    if (isActive()) commitRender();
  } catch {
    if (!isActive()) return;
    renderError(mainBody, 'Failed to load weekly data.');
  }
}
