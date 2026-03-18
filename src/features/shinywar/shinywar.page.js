// src/features/shinywar/shinywar.page.js
// v2.0.0-beta
// Shiny War page entry + UI render.

import { initPokemonDerivedDataOnce, getPokemonPointsMap } from '../../domains/pokemon/pokemon.data.js';
import { loadShinyWarConfig } from '../../data/shinywar.loader.js';
import { buildShinyWarModel } from '../../domains/shinywar/shinywar.model.js';

function assertValidRoot(root) {
  if (!root || !(root instanceof Element)) {
    throw new Error('SHINYWAR_INVALID_ROOT');
  }
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
    .map((part) => part ? part.charAt(0).toUpperCase() + part.slice(1) : '')
    .join('-');
}

function methodLabel(method) {
  const m = String(method || '').trim().toLowerCase();
  if (!m) return 'Unknown';
  if (m === 'mpb') return 'MPB';
  return m.charAt(0).toUpperCase() + m.slice(1).replace(/_/g, ' ');
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

function renderSidebar(sidebar, model, state, rerender) {
  if (!sidebar || typeof sidebar.setSections !== 'function') return;

  if (typeof sidebar.setTitle === 'function') sidebar.setTitle('SHINY WAR');
  if (typeof sidebar.setHint === 'function') sidebar.setHint('Derived live from Weekly + war config.');

  const statusNode = makeLines([
    `${model.summary.trackedEntries} tracked entries`,
    `${model.summary.scoredEntries} scored catches`,
    `${model.summary.failEntries} fail entries`,
    `${model.summary.pendingEntries} waiting for catch date`,
    `Current Day: ${model.currentDay || '—'}`
  ]);

  const filterWrap = document.createElement('div');
  filterWrap.className = 'ts-side-content';

  const select = document.createElement('select');
  select.className = 'ts-side-select';
  const opts = [{ value: 'all', label: 'All Teams' }].concat(model.teams.map((team) => ({ value: team.name, label: team.name })));
  opts.forEach((optCfg) => {
    const opt = document.createElement('option');
    opt.value = optCfg.value;
    opt.textContent = optCfg.label;
    select.appendChild(opt);
  });
  select.value = state.teamFilter;
  select.addEventListener('change', () => {
    state.teamFilter = select.value;
    rerender();
  });

  const showFailsBtn = document.createElement('button');
  showFailsBtn.type = 'button';
  showFailsBtn.className = 'ts-side-action';
  showFailsBtn.textContent = state.showFails ? 'Hide Fails' : 'Show Fails';
  showFailsBtn.addEventListener('click', () => {
    state.showFails = !state.showFails;
    rerender();
  });

  filterWrap.append(select, showFailsBtn);

  const leadersNode = makeLines(model.teams.map((team) => `#${team.rank} ${team.name} — ${team.points}P`));
  const daysNode = makeLines(model.rules.map((rule) => `Day ${rule.day}: ${rule.title}`));

  sidebar.setSections([
    { label: 'STATUS', node: statusNode },
    { label: 'FILTER', node: filterWrap },
    { label: 'LEADERS', node: leadersNode },
    { label: 'DAYS', node: daysNode },
  ]);
}

function makeTeamCard(team) {
  const card = document.createElement('article');
  card.className = 'ts-panel shinywar-team-card';
  card.innerHTML = `
    <div class="shinywar-team-rank">#${team.rank}</div>
    <h3 class="shinywar-team-name">${team.name}</h3>
    <div class="shinywar-team-leader">Leader: ${team.leader || '—'}</div>
    <div class="shinywar-team-stats">
      <div><strong>${team.points}P</strong><span>Points</span></div>
      <div><strong>${team.shinies}</strong><span>Shinies</span></div>
      <div><strong>${team.species}</strong><span>Species +5s</span></div>
      <div><strong>${team.fails}</strong><span>Fails</span></div>
    </div>
    <div class="shinywar-team-mvp">MVP: ${team.mvp ? `${team.mvp.member} — ${team.mvp.points}P` : '—'}</div>
  `;
  return card;
}

function makeLeaderboardTable(rows) {
  const table = document.createElement('table');
  table.className = 'shinywar-table';
  table.innerHTML = `
    <thead>
      <tr><th>#</th><th>Hunter</th><th>Team</th><th>Shinies</th><th>Points</th></tr>
    </thead>
    <tbody></tbody>
  `;
  const body = table.querySelector('tbody');
  if (!rows.length) {
    const tr = document.createElement('tr');
    tr.innerHTML = '<td colspan="5">No scored catches yet.</td>';
    body.appendChild(tr);
    return table;
  }
  rows.forEach((row) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${row.rank}</td>
      <td>${row.member}</td>
      <td>${row.team}</td>
      <td>${row.shinies}</td>
      <td>${row.points}P</td>
    `;
    body.appendChild(tr);
  });
  return table;
}

function makeRuleList(model) {
  const wrap = document.createElement('div');
  wrap.className = 'shinywar-rule-list';

  const species = document.createElement('div');
  species.className = 'shinywar-rule';
  species.innerHTML = `<strong>Species Bonus</strong><span>+${model.speciesBonusPoints} once per species per team.</span>`;
  wrap.appendChild(species);

  model.rules.forEach((rule) => {
    const item = document.createElement('div');
    item.className = 'shinywar-rule';
    item.innerHTML = `<strong>Day ${rule.day} ${rule.title}</strong><span>${rule.description || '—'}</span>`;
    wrap.appendChild(item);
  });
  return wrap;
}

function filteredEntries(model, state) {
  return model.entries.filter((entry) => {
    if (state.teamFilter !== 'all' && entry.team !== state.teamFilter) return false;
    if (!state.showFails && entry.failed) return false;
    return true;
  });
}

function makeLedger(entries) {
  const wrap = document.createElement('div');
  wrap.className = 'shinywar-ledger';
  if (!entries.length) {
    const empty = document.createElement('div');
    empty.className = 'shinywar-empty';
    empty.textContent = 'No war entries for the current filter.';
    wrap.appendChild(empty);
    return wrap;
  }

  entries.forEach((entry) => {
    const item = document.createElement('article');
    item.className = 'ts-panel shinywar-entry';
    if (entry.failed) item.classList.add('is-fail');
    if (entry.pendingDate) item.classList.add('is-pending');

    const pointsText = entry.failed ? '0P' : `${entry.totalPoints}P`;
    const pills = [
      entry.member,
      entry.team,
      entry.dateCatch ? formatDate(entry.dateCatch) : 'No catch date',
      entry.dayNumber ? `Day ${entry.dayNumber}` : 'Pending Day',
      methodLabel(entry.method)
    ];

    item.innerHTML = `
      <div class="shinywar-entry-head">
        <h3>${titleCasePokemon(entry.pokemon)}</h3>
        <div class="shinywar-points">${pointsText}</div>
      </div>
      <div class="shinywar-pills"></div>
      <div class="shinywar-breakdown">${entry.breakdown.length ? entry.breakdown.join(' • ') : 'No bonuses applied.'}</div>
    `;

    const pillsWrap = item.querySelector('.shinywar-pills');
    pills.forEach((text) => {
      const pill = document.createElement('span');
      pill.className = 'shinywar-pill';
      pill.textContent = text;
      pillsWrap.appendChild(pill);
    });

    wrap.appendChild(item);
  });

  return wrap;
}

function renderContent(root, model, state) {
  const screen = document.createElement('section');
  screen.className = 'shinywar-screen';

  const header = document.createElement('section');
  header.className = 'ts-panel shinywar-hero';
  header.innerHTML = `
    <h1 class="ts-panel-title">${model.title}</h1>
    <div class="shinywar-hero-sub">${formatDate(model.startDate)} – ${formatDate(model.endDate)} • Current Day ${model.currentDay || '—'} • ±${model.timezoneGraceDays} day timezone grace</div>
  `;

  const teams = document.createElement('section');
  teams.className = 'shinywar-team-grid';
  model.teams.forEach((team) => teams.appendChild(makeTeamCard(team)));

  const body = document.createElement('section');
  body.className = 'shinywar-main-grid';

  const ledgerPanel = document.createElement('section');
  ledgerPanel.className = 'ts-panel shinywar-block';
  const entries = filteredEntries(model, state);
  ledgerPanel.innerHTML = `<h2 class="ts-panel-title">Catch Ledger</h2>`;
  ledgerPanel.appendChild(makeLedger(entries));

  const side = document.createElement('div');
  side.className = 'shinywar-side';

  const mvpPanel = document.createElement('section');
  mvpPanel.className = 'ts-panel shinywar-block';
  mvpPanel.innerHTML = '<h2 class="ts-panel-title">MVP Leaderboard</h2>';
  mvpPanel.appendChild(makeLeaderboardTable(model.mvp.filter((row) => state.teamFilter === 'all' || row.team === state.teamFilter)));

  const rulesPanel = document.createElement('section');
  rulesPanel.className = 'ts-panel shinywar-block';
  rulesPanel.innerHTML = '<h2 class="ts-panel-title">War Rules Snapshot</h2>';
  rulesPanel.appendChild(makeRuleList(model));

  side.append(mvpPanel, rulesPanel);
  body.append(ledgerPanel, side);

  screen.append(header, teams, body);
  root.replaceChildren(screen);
}

export async function renderShinyWarPage(ctx) {
  const root = ctx && ctx.root;
  const sidebar = ctx && ctx.sidebar;
  const weeklyModel = ctx && ctx.params && ctx.params.weeklyModel;

  assertValidRoot(root);
  const state = { teamFilter: 'all', showFails: true };

  renderLoading(root);

  try {
    await initPokemonDerivedDataOnce();
    const config = await loadShinyWarConfig();
    const model = buildShinyWarModel({
      weeklyModel,
      config,
      pointsMap: getPokemonPointsMap()
    });

    const rerender = () => {
      renderSidebar(sidebar, model, state, rerender);
      renderContent(root, model, state);
    };

    rerender();
  } catch (err) {
    renderError(root, err && err.message ? err.message : err);
  }
}
