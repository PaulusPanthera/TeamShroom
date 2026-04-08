// src/features/shinywar/shinywar.page.js
// v2.0.0-beta
// Shiny War page entry + UI render.

import { initPokemonDerivedDataOnce, getPokemonPointsMap } from '../../domains/pokemon/pokemon.data.js';
import { renderUnifiedCard } from '../../ui/unifiedcard.js';
import { getPokemonDbShinyGifSrc } from '../../utils/utils.js';
import { loadShinyWarConfig } from '../../data/shinywar.loader.js';
import { buildShinyWarModel } from '../../domains/shinywar/shinywar.model.js';

function assertValidRoot(root) {
  if (!root || !(root instanceof Element)) {
    throw new Error('SHINYWAR_INVALID_ROOT');
  }
}

function norm(raw) {
  return String(raw || '').trim().toLowerCase();
}

function makeLines(lines) {
  const wrap = document.createElement('div');
  wrap.className = 'ts-subbar-stats';
  (Array.isArray(lines) ? lines : []).forEach((text) => {
    const line = document.createElement('div');
    line.textContent = String(text || '').trim();
    wrap.appendChild(line);
  });
  return wrap;
}

function formatDate(iso) {
  const s = String(iso || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return '—';
  return `${s.slice(8, 10)}.${s.slice(5, 7)}.${s.slice(0, 4)}`;
}

function titleCasePokemon(key) {
  const raw = String(key || '').trim();
  if (!raw) return 'Unknown';
  return raw
    .split('-')
    .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1) : ''))
    .join('-');
}

function methodLabel(method) {
  const m = String(method || '').trim().toLowerCase();
  if (!m) return 'Unknown';
  if (m === 'mpb') return 'MPB';
  return m.charAt(0).toUpperCase() + m.slice(1).replace(/_/g, ' ');
}

function formatCountdown(ms) {
  const safe = Math.max(0, Number(ms) || 0);
  const totalSeconds = Math.floor(safe / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function parseRolloverTime(raw, displayLabel) {
  const value = String(raw || '').trim();
  const match = value.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return { hours: 21, minutes: 0, label: String(displayLabel || '21:00') };
  const hours = Math.min(23, Math.max(0, Number(match[1]) || 0));
  const minutes = Math.min(59, Math.max(0, Number(match[2]) || 0));
  return {
    hours,
    minutes,
    label: String(displayLabel || `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`),
  };
}

function localIso(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return null;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function diffDays(aIso, bIso) {
  const a = Date.parse(`${String(aIso || '').trim()}T00:00:00Z`);
  const b = Date.parse(`${String(bIso || '').trim()}T00:00:00Z`);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return Math.round((b - a) / 86400000);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function computeLiveContext(model) {
  const rollover = parseRolloverTime(model && model.rolloverTime, model && model.rolloverDisplayLabel);
  const startDate = String(model && model.startDate || '').trim();
  const endDate = String(model && model.endDate || '').trim();
  const totalDaysRaw = diffDays(startDate, endDate);
  const totalDays = Number.isFinite(totalDaysRaw) ? Math.max(1, totalDaysRaw + 1) : 1;

  const now = new Date();
  const nextRollover = new Date(now);
  nextRollover.setHours(rollover.hours, rollover.minutes, 0, 0);

  const effective = new Date(now);
  if (now.getTime() >= nextRollover.getTime()) {
    nextRollover.setDate(nextRollover.getDate() + 1);
    effective.setDate(effective.getDate() + 1);
  }

  const effectiveIso = localIso(effective);
  const dayOffset = diffDays(startDate, effectiveIso);
  const currentDay = Number.isFinite(dayOffset) ? clamp(dayOffset + 1, 1, totalDays) : null;
  const rule = Array.isArray(model && model.rules)
    ? model.rules.find((item) => Number(item && item.day) === Number(currentDay)) || null
    : null;

  return {
    currentDay,
    rule,
    rolloverLabel: rollover.label,
    countdownLabel: formatCountdown(nextRollover.getTime() - now.getTime()),
    effectiveIso,
  };
}

function renderLoading(root) {
  const panel = document.createElement('section');
  panel.className = 'ts-panel shinywar-screen';
  panel.innerHTML = '<h2 class="ts-panel-title">Loading War Board...</h2>';
  root.replaceChildren(panel);
}

function renderError(root, message) {
  const panel = document.createElement('section');
  panel.className = 'ts-panel shinywar-screen';
  panel.innerHTML = `<h2 class="ts-panel-title">Failed to load Shiny War</h2><div class="shinywar-empty">${String(message || 'Unknown error')}</div>`;
  root.replaceChildren(panel);
}

function makeSidebarStatus(model) {
  return makeLines([
    `${model.summary.trackedEntries} tracked entries`,
    `${model.summary.scoredEntries} scored catches`,
    `${model.summary.activeHunters || model.mvp.length} active hunters`,
  ]);
}

function makeSidebarLiveDay(model, live) {
  const lines = [
    `Current Day: ${live.currentDay || '—'}`,
    live.rule && live.rule.title ? live.rule.title : 'No active rule',
    live.rule && live.rule.description ? live.rule.description : 'Weekly dates decide scoring.',
    `Next rollover in ${live.countdownLabel}`,
    `Rollover at ${live.rolloverLabel}`,
  ];
  return makeLines(lines);
}

function makeSidebarControls(model, state, rerender) {
  const wrap = document.createElement('div');
  wrap.className = 'shinywar-side-controls';

  const viewSelect = document.createElement('select');
  viewSelect.className = 'ts-side-select';
  [
    ['overview', 'Overview'],
    ['today', 'Today'],
    ['ledger', 'Ledger'],
    ['teams', 'Teams'],
    ['rules', 'Rules']
  ].forEach(([value, label]) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    viewSelect.appendChild(option);
  });
  viewSelect.value = state.viewMode;
  viewSelect.addEventListener('change', () => {
    state.viewMode = viewSelect.value;
    rerender();
  });

  const teamSelect = document.createElement('select');
  teamSelect.className = 'ts-side-select';
  [
    { value: 'all', label: 'All Teams' },
    ...model.teams.map((team) => ({ value: team.name, label: team.name }))
  ].forEach((cfg) => {
    const option = document.createElement('option');
    option.value = cfg.value;
    option.textContent = cfg.label;
    teamSelect.appendChild(option);
  });
  teamSelect.value = state.teamFilter;
  teamSelect.addEventListener('change', () => {
    state.teamFilter = teamSelect.value;
    rerender();
  });

  const sortSelect = document.createElement('select');
  sortSelect.className = 'ts-side-select';
  [
    ['latest', 'Sort: Latest'],
    ['points', 'Sort: Highest Points'],
    ['hunter', 'Sort: Hunter A–Z']
  ].forEach(([value, label]) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    sortSelect.appendChild(option);
  });
  sortSelect.value = state.sortMode;
  sortSelect.addEventListener('change', () => {
    state.sortMode = sortSelect.value;
    rerender();
  });

  const failsBtn = document.createElement('button');
  failsBtn.type = 'button';
  failsBtn.className = 'ts-side-action';
  failsBtn.textContent = state.showFails ? 'Hide Fails' : 'Show Fails';
  failsBtn.addEventListener('click', () => {
    state.showFails = !state.showFails;
    rerender();
  });

  const resetBtn = document.createElement('button');
  resetBtn.type = 'button';
  resetBtn.className = 'ts-side-action';
  resetBtn.textContent = 'Reset View';
  resetBtn.addEventListener('click', () => {
    state.viewMode = 'overview';
    state.teamFilter = 'all';
    state.sortMode = 'latest';
    state.showFails = true;
    rerender();
  });

  const hint = document.createElement('div');
  hint.className = 'shinywar-side-hint';
  hint.textContent = 'Use view mode + filters here. Weekly stays the source of truth.';

  wrap.append(viewSelect, teamSelect, sortSelect, failsBtn, resetBtn, hint);
  return wrap;
}

function makeSidebarLeaders(model) {
  const overallMvp = Array.isArray(model.mvp) && model.mvp.length ? model.mvp[0] : null;
  const latestScored = [...model.entries]
    .filter((entry) => !entry.pendingDate)
    .sort((a, b) => {
      if (a.dateCatch && b.dateCatch && a.dateCatch !== b.dateCatch) return b.dateCatch.localeCompare(a.dateCatch);
      return b.id.localeCompare(a.id);
    })[0] || null;

  const lines = [];
  if (model.teams[0]) lines.push(`#1 Team: ${model.teams[0].name} — ${model.teams[0].points}P`);
  if (overallMvp) lines.push(`MVP: ${overallMvp.member} — ${overallMvp.points}P`);
  if (latestScored) lines.push(`Latest: ${titleCasePokemon(latestScored.pokemon)} by ${latestScored.member}`);
  return makeLines(lines);
}

function renderSidebar(sidebar, model, state, live, rerender) {
  if (!sidebar || typeof sidebar.setSections !== 'function') return;
  if (typeof sidebar.setTitle === 'function') sidebar.setTitle('SHINY WAR');
  if (typeof sidebar.setHint === 'function') {
    sidebar.setHint('Switch views, filter teams, and track the live war clock here.');
  }

  sidebar.setSections([
    { label: 'STATUS', node: makeSidebarStatus(model) },
    { label: 'LIVE DAY', node: makeSidebarLiveDay(model, live) },
    { label: 'CONTROLS', node: makeSidebarControls(model, state, rerender) },
    { label: 'LEADERS', node: makeSidebarLeaders(model) },
  ]);
}

function makeTeamCard(team) {
  const card = document.createElement('article');
  card.className = 'ts-panel shinywar-summary-card';
  card.innerHTML = `
    <div class="shinywar-summary-top">
      <div>
        <div class="shinywar-summary-rank">#${team.rank}</div>
        <h3 class="shinywar-summary-name">${team.name}</h3>
      </div>
      <div class="shinywar-summary-points">${team.points}P</div>
    </div>
    <div class="shinywar-summary-leader">Leader: ${team.leader || '—'}</div>
    <div class="shinywar-summary-stats is-compact">
      <div><strong>${team.shinies}</strong><span>Scored shinies</span></div>
      <div><strong>${team.species}</strong><span>Species +5s</span></div>
    </div>
    <div class="shinywar-summary-footer">${team.mvp ? `Current MVP: ${team.mvp.member} · ${team.mvp.points}P` : 'No scored catches yet.'}</div>
  `;
  return card;
}

function makeEntryPill(text, extraClass) {
  const pill = document.createElement('span');
  pill.className = ['shinywar-pill', extraClass].filter(Boolean).join(' ');
  pill.textContent = text;
  return pill;
}

function sortEntries(entries, mode) {
  const list = [...entries];
  if (mode === 'points') {
    list.sort((a, b) => (b.totalPoints - a.totalPoints) || String(b.dateCatch || '').localeCompare(String(a.dateCatch || '')) || a.member.localeCompare(b.member));
    return list;
  }
  if (mode === 'hunter') {
    list.sort((a, b) => a.member.localeCompare(b.member) || String(b.dateCatch || '').localeCompare(String(a.dateCatch || '')) || titleCasePokemon(a.pokemon).localeCompare(titleCasePokemon(b.pokemon)));
    return list;
  }
  list.sort((a, b) => {
    if (a.dateCatch && b.dateCatch && a.dateCatch !== b.dateCatch) return b.dateCatch.localeCompare(a.dateCatch);
    if (a.dayNumber !== b.dayNumber) return (b.dayNumber || 0) - (a.dayNumber || 0);
    return b.id.localeCompare(a.id);
  });
  return list;
}

function filteredEntries(model, state, live, options = {}) {
  const onlyDay = options.onlyDay != null ? options.onlyDay : null;
  return sortEntries(model.entries.filter((entry) => {
    if (state.teamFilter !== 'all' && entry.team !== state.teamFilter) return false;
    if (!state.showFails && entry.failed) return false;
    if (onlyDay != null && Number(entry.dayNumber) !== Number(onlyDay)) return false;
    return true;
  }), state.sortMode);
}

function makeLedger(entries, options = {}) {
  const wrap = document.createElement('div');
  wrap.className = 'shinywar-ledger';
  if (!entries.length) {
    const empty = document.createElement('div');
    empty.className = 'shinywar-empty';
    empty.textContent = options.emptyText || 'No war entries for the current filter.';
    wrap.appendChild(empty);
    return wrap;
  }

  entries.forEach((entry) => {
    const item = document.createElement('article');
    item.className = 'ts-panel shinywar-entry';
    if (entry.failed) item.classList.add('is-fail');
    if (entry.pendingDate) item.classList.add('is-pending');

    const frame = document.createElement('div');
    frame.className = 'shinywar-entry-frame';

    const card = renderUnifiedCard({
      cardType: 'pokemon',
      pokemonKey: entry.pokemon,
      pokemonName: titleCasePokemon(entry.pokemon),
      artSrc: getPokemonDbShinyGifSrc(entry.pokemon),
      points: null,
      infoText: entry.member,
      isUnclaimed: false,
      headerRightText: entry.failed ? '0P' : `${entry.totalPoints}P`,
      showVariants: false,
    });
    card.classList.add('shinywar-entry-card');

    const details = document.createElement('div');
    details.className = 'shinywar-entry-details';

    const head = document.createElement('div');
    head.className = 'shinywar-entry-head';
    head.innerHTML = `
      <div class="shinywar-entry-topline">
        <div class="shinywar-entry-species">${titleCasePokemon(entry.pokemon)}</div>
        <div class="shinywar-entry-score">${entry.failed ? '0P' : `${entry.totalPoints}P`}</div>
      </div>
      <div class="shinywar-entry-subline">${entry.member} · ${entry.team}</div>
    `;

    const pillsWrap = document.createElement('div');
    pillsWrap.className = 'shinywar-pills';
    pillsWrap.append(
      makeEntryPill(entry.dateCatch ? formatDate(entry.dateCatch) : 'No catch date'),
      makeEntryPill(entry.dayNumber ? `Day ${entry.dayNumber}` : 'Pending Day'),
      makeEntryPill(methodLabel(entry.method))
    );
    if (entry.secret) pillsWrap.appendChild(makeEntryPill('Secret', 'is-highlight'));
    if (entry.safari) pillsWrap.appendChild(makeEntryPill('Safari', 'is-highlight'));
    if (entry.failed) pillsWrap.appendChild(makeEntryPill(entry.run ? 'Run Fail' : 'Lost Fail', 'is-fail'));
    if (entry.claimSlot && entry.claimMode === 'fallback') {
      pillsWrap.appendChild(makeEntryPill(`Claims ${titleCasePokemon(entry.claimSlot)}`, 'is-claim'));
    } else if (entry.dexUnclaimed) {
      pillsWrap.appendChild(makeEntryPill('Dex Hit', 'is-claim'));
    }

    const breakdown = document.createElement('div');
    breakdown.className = 'shinywar-breakdown';
    breakdown.textContent = entry.breakdown.length ? entry.breakdown.join(' • ') : 'No bonuses applied.';

    details.append(head, pillsWrap, breakdown);
    frame.append(card, details);
    item.appendChild(frame);
    wrap.appendChild(item);
  });

  return wrap;
}

function makeLeaderboardList(rows, maxRows = null, emptyText = 'No scored catches yet.') {
  const wrap = document.createElement('div');
  wrap.className = 'shinywar-rank-list';
  const list = (Array.isArray(rows) ? rows : []).slice(0, maxRows == null ? undefined : maxRows);
  if (!list.length) {
    const empty = document.createElement('div');
    empty.className = 'shinywar-empty';
    empty.textContent = emptyText;
    wrap.appendChild(empty);
    return wrap;
  }
  list.forEach((row) => {
    const item = document.createElement('div');
    item.className = 'shinywar-rank-row';
    item.innerHTML = `
      <div class="shinywar-rank-left">
        <div class="shinywar-rank-pos">#${row.rank}</div>
        <div class="shinywar-rank-meta">
          <div class="shinywar-rank-name">${row.member}</div>
          <div class="shinywar-rank-sub">${row.team} · ${row.shinies} shiny${row.shinies === 1 ? '' : 'ies'}</div>
        </div>
      </div>
      <div class="shinywar-rank-points">${row.points}P</div>
    `;
    wrap.appendChild(item);
  });
  return wrap;
}

function makeTodayRaceRows(entries) {
  const wrap = document.createElement('div');
  wrap.className = 'shinywar-rank-list';
  const byTeam = Object.create(null);
  entries.forEach((entry) => {
    if (!byTeam[entry.team]) byTeam[entry.team] = { team: entry.team, points: 0, shinies: 0, fails: 0 };
    if (entry.failed) {
      byTeam[entry.team].fails += 1;
      return;
    }
    byTeam[entry.team].points += Number(entry.totalPoints) || 0;
    byTeam[entry.team].shinies += 1;
  });
  const rows = Object.values(byTeam).sort((a, b) => (b.points - a.points) || (b.shinies - a.shinies) || a.team.localeCompare(b.team));
  if (!rows.length) {
    const empty = document.createElement('div');
    empty.className = 'shinywar-empty';
    empty.textContent = 'No catches for the active day yet.';
    wrap.appendChild(empty);
    return wrap;
  }
  rows.forEach((row, index) => {
    const item = document.createElement('div');
    item.className = 'shinywar-rank-row is-team';
    item.innerHTML = `
      <div class="shinywar-rank-left">
        <div class="shinywar-rank-pos">#${index + 1}</div>
        <div class="shinywar-rank-meta">
          <div class="shinywar-rank-name">${row.team}</div>
          <div class="shinywar-rank-sub">${row.shinies} shiny${row.shinies === 1 ? '' : 'ies'}</div>
        </div>
      </div>
      <div class="shinywar-rank-points">${row.points}P</div>
    `;
    wrap.appendChild(item);
  });
  return wrap;
}

function makeCompactDayPanel(model, live, entries) {
  const panel = document.createElement('section');
  panel.className = 'ts-panel shinywar-block';
  panel.innerHTML = '<h2 class="ts-panel-title">Current Day Focus</h2>';

  const wrap = document.createElement('div');
  wrap.className = 'shinywar-focus';

  const title = document.createElement('div');
  title.className = 'shinywar-focus-title';
  title.textContent = live.rule ? `Day ${live.currentDay} · ${live.rule.title}` : 'No active day';

  const desc = document.createElement('div');
  desc.className = 'shinywar-focus-desc';
  desc.textContent = live.rule && live.rule.description ? live.rule.description : 'Weekly dates stay authoritative for scoring.';

  const meta = document.createElement('div');
  meta.className = 'shinywar-focus-meta';
  meta.textContent = `Next rollover in ${live.countdownLabel} · ${live.rolloverLabel}`;

  const todayPoints = entries.reduce((sum, entry) => sum + (Number(entry.totalPoints) || 0), 0);
  const summary = document.createElement('div');
  summary.className = 'shinywar-focus-summary';
  summary.innerHTML = `
    <div><strong>${entries.filter((entry) => !entry.failed && !entry.pendingDate).length}</strong><span>Today catches</span></div>
    <div><strong>${todayPoints}P</strong><span>Today points</span></div>
  `;

  wrap.append(title, desc, meta, summary);
  panel.appendChild(wrap);
  return panel;
}

function makeCompactCatchGrid(entries, options = {}) {
  const wrap = document.createElement('div');
  wrap.className = 'shinywar-catch-grid';
  const list = Array.isArray(entries) ? entries : [];
  if (!list.length) {
    const empty = document.createElement('div');
    empty.className = 'shinywar-empty';
    empty.textContent = options.emptyText || 'No catches for this view yet.';
    wrap.appendChild(empty);
    return wrap;
  }

  list.forEach((entry) => {
    const item = document.createElement('article');
    item.className = 'ts-panel shinywar-catch-tile';
    if (entry.failed) item.classList.add('is-fail');
    if (entry.pendingDate) item.classList.add('is-pending');

    const top = document.createElement('div');
    top.className = 'shinywar-catch-tile-top';
    const team = document.createElement('div');
    team.className = 'shinywar-catch-tile-team';
    team.textContent = entry.team;
    const score = document.createElement('div');
    score.className = 'shinywar-catch-tile-score';
    score.textContent = entry.failed ? '0P' : `${entry.totalPoints}P`;
    top.append(team, score);

    const frame = document.createElement('div');
    frame.className = 'shinywar-catch-tile-frame';

    const card = renderUnifiedCard({
      cardType: 'pokemon',
      pokemonKey: entry.pokemon,
      pokemonName: titleCasePokemon(entry.pokemon),
      artSrc: getPokemonDbShinyGifSrc(entry.pokemon),
      points: null,
      infoText: entry.member,
      isUnclaimed: false,
      headerRightText: entry.failed ? '0P' : `${entry.totalPoints}P`,
      showVariants: false,
    });
    card.classList.add('shinywar-catch-tile-card');

    const body = document.createElement('div');
    body.className = 'shinywar-catch-tile-body';
    body.innerHTML = `
      <div class="shinywar-catch-tile-name">${titleCasePokemon(entry.pokemon)}</div>
      <div class="shinywar-catch-tile-hunter">${entry.member}</div>
    `;

    const pills = document.createElement('div');
    pills.className = 'shinywar-pills';
    pills.append(
      makeEntryPill(entry.dateCatch ? formatDate(entry.dateCatch) : 'No catch date'),
      makeEntryPill(entry.dayNumber ? `Day ${entry.dayNumber}` : 'Pending Day'),
      makeEntryPill(methodLabel(entry.method))
    );
    if (entry.failed) pills.appendChild(makeEntryPill(entry.run ? 'Run Fail' : 'Lost Fail', 'is-fail'));
    else if (entry.claimSlot && entry.claimMode === 'fallback') pills.appendChild(makeEntryPill(`Claims ${titleCasePokemon(entry.claimSlot)}`, 'is-claim'));
    else if (entry.dexUnclaimed) pills.appendChild(makeEntryPill('Dex Hit', 'is-claim'));

    const breakdown = document.createElement('div');
    breakdown.className = 'shinywar-catch-tile-breakdown';
    breakdown.textContent = entry.breakdown.length ? entry.breakdown.join(' • ') : 'No bonuses applied.';

    body.append(pills, breakdown);
    frame.append(card, body);
    item.append(top, frame);
    wrap.appendChild(item);
  });

  return wrap;
}

function makeOverviewCards(model, live, state) {
  const section = document.createElement('section');
  section.className = 'shinywar-overview-grid';

  const main = document.createElement('div');
  main.className = 'shinywar-side-stack';

  const recentPanel = document.createElement('section');
  recentPanel.className = 'ts-panel shinywar-block';
  recentPanel.innerHTML = '<h2 class="ts-panel-title">Recent Catches</h2><div class="shinywar-block-sub">Latest live war catches. Open Ledger for the full history.</div>';
  recentPanel.appendChild(makeCompactCatchGrid(filteredEntries(model, state, live).slice(0, 4), { emptyText: 'No recent catches yet.' }));
  main.appendChild(recentPanel);

  const side = document.createElement('div');
  side.className = 'shinywar-side-stack';

  const livePanel = document.createElement('section');
  livePanel.className = 'ts-panel shinywar-block';
  livePanel.innerHTML = `<h2 class="ts-panel-title">Today’s Board</h2><div class="shinywar-block-sub">Day ${live.currentDay || '—'} · ${live.rule && live.rule.title ? live.rule.title : 'No active rule'} · ${live.rolloverLabel}</div>`;
  const dayEntries = filteredEntries(model, state, live, { onlyDay: live.currentDay });
  const liveHint = document.createElement('div');
  liveHint.className = 'shinywar-focus-desc';
  liveHint.textContent = live.rule && live.rule.description ? live.rule.description : 'Weekly dates stay authoritative for scoring.';
  livePanel.appendChild(makeTodayRaceRows(dayEntries));
  livePanel.appendChild(liveHint);
  side.appendChild(livePanel);

  side.appendChild(makeCompactDayPanel(model, live, dayEntries));

  const mvpPanel = document.createElement('section');
  mvpPanel.className = 'ts-panel shinywar-block';
  mvpPanel.innerHTML = '<h2 class="ts-panel-title">Top Hunters</h2><div class="shinywar-block-sub">Best current scores for the active filter.</div>';
  mvpPanel.appendChild(makeLeaderboardList(model.mvp.filter((row) => state.teamFilter === 'all' || row.team === state.teamFilter), 8));
  side.appendChild(mvpPanel);

  section.append(main, side);
  return section;
}

function makeTodayView(model, state, live) {
  const section = document.createElement('section');
  section.className = 'shinywar-overview-grid';
  const todayEntries = filteredEntries(model, state, live, { onlyDay: live.currentDay });

  const todayPanel = document.createElement('section');
  todayPanel.className = 'ts-panel shinywar-block';
  todayPanel.innerHTML = `<h2 class="ts-panel-title">Day ${live.currentDay || '—'} Catches</h2><div class="shinywar-block-sub">${live.rule && live.rule.title ? live.rule.title : 'No active rule'} · ${state.showFails ? 'Fails visible' : 'Fails hidden'}</div>`;
  todayPanel.appendChild(makeCompactCatchGrid(todayEntries, { emptyText: 'No catches on the current day yet.' }));

  const side = document.createElement('div');
  side.className = 'shinywar-side-stack';
  side.appendChild(makeCompactDayPanel(model, live, todayEntries));

  const teamPanel = document.createElement('section');
  teamPanel.className = 'ts-panel shinywar-block';
  teamPanel.innerHTML = '<h2 class="ts-panel-title">Today’s Team Race</h2>';
  teamPanel.appendChild(makeTodayRaceRows(todayEntries));
  side.appendChild(teamPanel);

  section.append(todayPanel, side);
  return section;
}

function makeLedgerView(model, state, live) {
  const section = document.createElement('section');
  section.className = 'shinywar-overview-grid';

  const ledgerPanel = document.createElement('section');
  ledgerPanel.className = 'ts-panel shinywar-block';
  const filterLabel = state.teamFilter === 'all' ? 'All Teams' : state.teamFilter;
  ledgerPanel.innerHTML = `<h2 class="ts-panel-title">Full Ledger</h2><div class="shinywar-block-sub">${filterLabel} · Sorted by ${state.sortMode}${state.showFails ? ' · Fails visible' : ''}</div>`;
  ledgerPanel.appendChild(makeLedger(filteredEntries(model, state, live)));

  const side = document.createElement('div');
  side.className = 'shinywar-side-stack';

  const mvpPanel = document.createElement('section');
  mvpPanel.className = 'ts-panel shinywar-block';
  mvpPanel.innerHTML = '<h2 class="ts-panel-title">Filtered MVP</h2><div class="shinywar-block-sub">Best scores for the current filter.</div>';
  mvpPanel.appendChild(makeLeaderboardList(model.mvp.filter((row) => state.teamFilter === 'all' || row.team === state.teamFilter)));

  side.appendChild(mvpPanel);
  section.append(ledgerPanel, side);
  return section;
}

function makeTeamDetails(team, state, live, model) {
  const panel = document.createElement('section');
  panel.className = 'ts-panel shinywar-block';
  panel.innerHTML = `<h2 class="ts-panel-title">${team.name}</h2><div class="shinywar-block-sub">Leader: ${team.leader || '—'} · ${team.points}P total</div>`;

  const mini = document.createElement('div');
  mini.className = 'shinywar-team-mini';
  mini.innerHTML = `
    <div><strong>${team.shinies}</strong><span>Scored</span></div>
    <div><strong>${team.species}</strong><span>Species</span></div>
  `;
  panel.appendChild(mini);

  const leaderTable = document.createElement('table');
  leaderTable.className = 'shinywar-table';
  leaderTable.innerHTML = '<thead><tr><th>Hunter</th><th>Shinies</th><th>Points</th></tr></thead><tbody></tbody>';
  const body = leaderTable.querySelector('tbody');

  const memberRows = model.mvp.filter((row) => row.team === team.name).slice(0, 6);
  if (!memberRows.length) {
    const tr = document.createElement('tr');
    tr.innerHTML = '<td colspan="3">No scored catches yet.</td>';
    body.appendChild(tr);
  } else {
    memberRows.forEach((row) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${row.member}</td><td>${row.shinies}</td><td>${row.points}P</td>`;
      body.appendChild(tr);
    });
  }
  panel.appendChild(leaderTable);

  const recent = filteredEntries(model, { ...state, teamFilter: team.name }, live).slice(0, 3);
  const recentWrap = document.createElement('div');
  recentWrap.className = 'shinywar-mini-ledger';
  recent.forEach((entry) => {
    const row = document.createElement('div');
    row.className = 'shinywar-mini-ledger-row';
    row.textContent = `${titleCasePokemon(entry.pokemon)} · ${entry.member} · ${entry.failed ? '0P' : `${entry.totalPoints}P`}`;
    recentWrap.appendChild(row);
  });
  if (!recent.length) {
    const row = document.createElement('div');
    row.className = 'shinywar-mini-ledger-row';
    row.textContent = 'No recent catches.';
    recentWrap.appendChild(row);
  }
  panel.appendChild(recentWrap);

  return panel;
}

function makeTeamsView(model, state, live) {
  const section = document.createElement('section');
  section.className = 'shinywar-team-grid';
  model.teams
    .filter((team) => state.teamFilter === 'all' || team.name === state.teamFilter)
    .forEach((team) => section.appendChild(makeTeamDetails(team, state, live, model)));
  return section;
}

function makeRulesView(model, live) {
  const section = document.createElement('section');
  section.className = 'shinywar-rules-grid';
  (Array.isArray(model.rules) ? model.rules : []).forEach((rule) => {
    const panel = document.createElement('section');
    panel.className = 'ts-panel shinywar-block shinywar-rule-card';
    if (Number(rule.day) === Number(live.currentDay)) panel.classList.add('is-active');
    panel.innerHTML = `
      <h2 class="ts-panel-title">Day ${rule.day} · ${rule.title}</h2>
      <div class="shinywar-block-sub">${rule.description || 'No description.'}</div>
    `;
    section.appendChild(panel);
  });
  return section;
}

function renderMainView(screen, model, state, live) {
  if (state.viewMode === 'today') {
    screen.appendChild(makeTodayView(model, state, live));
    return;
  }
  if (state.viewMode === 'ledger') {
    screen.appendChild(makeLedgerView(model, state, live));
    return;
  }
  if (state.viewMode === 'teams') {
    screen.appendChild(makeTeamsView(model, state, live));
    return;
  }
  if (state.viewMode === 'rules') {
    screen.appendChild(makeRulesView(model, live));
    return;
  }
  screen.appendChild(makeOverviewCards(model, live, state));
}

function renderContent(root, model, state, live) {
  const screen = document.createElement('section');
  screen.className = 'shinywar-screen';

  const header = document.createElement('section');
  header.className = 'ts-panel shinywar-hero';
  header.innerHTML = `
    <h1 class="ts-panel-title">${model.title}</h1>
    <div class="shinywar-hero-sub">${formatDate(model.startDate)} – ${formatDate(model.endDate)} · Current Day ${live.currentDay || '—'} · Next rollover in ${live.countdownLabel} · ${model.summary.totalPoints} total points</div>
  `;

  screen.append(header);
  if (state.viewMode === 'overview' || state.viewMode === 'today') {
    const teams = document.createElement('section');
    teams.className = 'shinywar-summary-grid';
    model.teams
      .filter((team) => state.teamFilter === 'all' || team.name === state.teamFilter)
      .forEach((team) => teams.appendChild(makeTeamCard(team)));
    screen.appendChild(teams);
  }
  renderMainView(screen, model, state, live);
  root.replaceChildren(screen);
}

export async function renderShinyWarPage(ctx) {
  const root = ctx && ctx.root;
  const sidebar = ctx && ctx.sidebar;
  const weeklyModel = ctx && ctx.params && ctx.params.weeklyModel;
  const isActive = typeof (ctx && ctx.isActive) === 'function' ? ctx.isActive : () => true;

  assertValidRoot(root);
  const state = {
    teamFilter: 'all',
    showFails: true,
    sortMode: 'latest',
    viewMode: 'overview'
  };

  renderLoading(root);

  try {
    await initPokemonDerivedDataOnce();
    const config = await loadShinyWarConfig();
    if (!isActive()) return;
    const model = buildShinyWarModel({
      weeklyModel,
      config,
      pointsMap: getPokemonPointsMap()
    });

    let timer = null;
    const rerender = () => {
      if (!isActive()) return;
      const live = computeLiveContext(model);
      renderSidebar(sidebar, model, state, live, rerender);
      renderContent(root, model, state, live);
    };

    rerender();
    timer = window.setInterval(rerender, 30000);

    return () => {
      if (timer) window.clearInterval(timer);
    };
  } catch (err) {
    if (!isActive()) return;
    renderError(root, err && err.message ? err.message : err);
  }
}
