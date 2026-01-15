// src/features/shinyweekly/shinyweekly.ui.js
// v2.0.0-beta
// Shiny Weekly overview + week content renderer (feature-scoped, DOM-only)

import { renderUnifiedCard } from '../../ui/unifiedcard.js';
import { prettifyPokemonName, getPokemonDbShinyGifSrc } from '../../utils/utils.js';

const WEEKLY_STYLE_ID = 'ts-weekly-style-v2';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

function normalize(str) {
  return String(str || '').trim().toLowerCase();
}

function parseIsoDate(iso) {
  const s = String(iso || '').trim();
  const m = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(s);
  if (!m) return null;

  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);

  const dt = new Date(Date.UTC(y, mo, d));
  if (!Number.isFinite(dt.getTime())) return null;
  return dt;
}

function deriveIsoFromWeekKey(weekKey, which) {
  const s = String(weekKey || '').trim();
  const m = /^([0-9]{4}-[0-9]{2}-[0-9]{2})_to_([0-9]{4}-[0-9]{2}-[0-9]{2})$/.exec(s);
  if (!m) return null;
  return which === 'end' ? m[2] : m[1];
}

function getWeekStartDate(week) {
  const iso = (week && week.dateStart) || deriveIsoFromWeekKey(week && week.week, 'start');
  return parseIsoDate(iso);
}

function getWeekEndDate(week) {
  const iso = (week && week.dateEnd) || deriveIsoFromWeekKey(week && week.week, 'end');
  return parseIsoDate(iso);
}

function formatMonthYear(dt) {
  if (!dt) return 'Unknown';
  const month = MONTH_NAMES[dt.getUTCMonth()] || 'Unknown';
  const year = dt.getUTCFullYear();
  return `${month} ${year}`;
}

function formatShortMonth(dt) {
  if (!dt) return '';
  const m = MONTH_NAMES[dt.getUTCMonth()] || '';
  return m ? m.slice(0, 3) : '';
}

function formatWeekShortLabel(week) {
  const start = getWeekStartDate(week);
  const end = getWeekEndDate(week);

  if (!start || !end) {
    return week && (week.label || week.week) ? String(week.label || week.week) : 'Week';
  }

  const startMonth = formatShortMonth(start);
  const endMonth = formatShortMonth(end);

  const startDay = start.getUTCDate();
  const endDay = end.getUTCDate();

  const sameMonth = start.getUTCMonth() === end.getUTCMonth() && start.getUTCFullYear() === end.getUTCFullYear();

  if (sameMonth) {
    return `${startMonth} ${startDay}–${endDay}`;
  }

  return `${startMonth} ${startDay}–${endMonth} ${endDay}`;
}

function installWeeklyStyles() {
  if (document.getElementById(WEEKLY_STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = WEEKLY_STYLE_ID;

  style.textContent = `
    /* Feature-scoped: Shiny Weekly overview + week content */

    .weekly-root{
      max-width: 1600px;
      margin: var(--space-3) auto;
      padding: 0 var(--space-3);
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
      box-sizing: border-box;
    }

    .weekly-state{
      display: inline-flex;
      align-self: flex-start;

      background: rgba(16, 20, 24, 0.78);
      border: 2px solid rgba(58, 70, 81, 0.85);
      border-radius: 0;

      padding: 10px 12px;
      color: var(--text-main);
      font-size: var(--font-small);

      box-shadow:
        0 0 0 1px rgba(0,0,0,0.70) inset,
        0 1px 0 rgba(255,255,255,0.06) inset,
        0 3px 0 rgba(0,0,0,0.55);
    }

    /* -------------------------
       OVERVIEW (CALENDAR)
    ------------------------- */

    .weekly-overview-month{
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .weekly-overview-month-title{
      margin: 0;
      padding: 0;
      font-size: var(--font-section-title);
      letter-spacing: 2px;
      color: var(--text-main);
      text-shadow: 1px 1px 0 rgba(0,0,0,0.85);
    }

    .weekly-week-grid{
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 14px;
      align-items: stretch;
      box-sizing: border-box;
    }

    /* Compact floating week tiles */
    .weekly-week-tile{
      width: 100%;
      box-sizing: border-box;

      display: flex;
      flex-direction: column;
      align-items: flex-start;
      justify-content: center;
      gap: 6px;

      padding: 12px 14px;
      min-height: 56px;
      text-align: left;

      background: rgba(14, 18, 22, 0.60);
      border: 2px solid rgba(58, 70, 81, 0.85);
      border-radius: 0;

      box-shadow:
        0 0 0 1px rgba(0,0,0,0.70) inset,
        0 1px 0 rgba(255,255,255,0.08) inset,
        0 3px 0 rgba(0,0,0,0.55);

      cursor: pointer;
      user-select: none;

      overflow: hidden;
      min-width: 0;
    }

    .weekly-week-tile:hover{
      border-color: rgba(240, 91, 41, 0.80);
      background: rgba(14, 18, 22, 0.70);
    }

    .weekly-week-tile:active{
      transform: translateY(1px);
      box-shadow:
        0 0 0 1px rgba(0,0,0,0.70) inset,
        0 1px 0 rgba(255,255,255,0.08) inset,
        0 2px 0 rgba(0,0,0,0.55);
    }

    .weekly-week-tile.is-selected{
      border-color: rgba(240, 91, 41, 0.95);
      background: rgba(14, 18, 22, 0.74);
      box-shadow:
        0 0 0 1px rgba(0,0,0,0.70) inset,
        0 1px 0 rgba(255,255,255,0.10) inset,
        0 3px 0 rgba(0,0,0,0.55);
    }

    .weekly-week-tile:focus-visible{
      outline: 2px solid rgba(240, 91, 41, 0.95);
      outline-offset: 2px;
    }

    .weekly-week-label{
      color: var(--accent);
      letter-spacing: 1px;
      font-size: 14px;
      line-height: 1.15;
      white-space: nowrap;

      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .weekly-week-stats{
      color: var(--text-muted);
      font-size: 12px;
      line-height: 1.15;
      white-space: nowrap;
      opacity: 0.95;

      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* -------------------------
       WEEK CONTENT
    ------------------------- */

    .weekly-week-header{
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;

      padding: 10px 12px;

      background: rgba(16, 20, 24, 0.78);
      border: 2px solid rgba(58, 70, 81, 0.85);
      border-radius: 0;

      box-shadow:
        0 0 0 1px rgba(0,0,0,0.70) inset,
        0 1px 0 rgba(255,255,255,0.06) inset,
        0 3px 0 rgba(0,0,0,0.55);
    }

    .weekly-week-header-left{
      display: inline-flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      min-width: 0;
    }

    .weekly-back-btn{
      background: rgba(14, 18, 22, 0.78);
      border: 2px solid rgba(240, 91, 41, 0.85);
      border-radius: 0;

      padding: 8px 10px;
      color: var(--text-main);
      font-size: 12px;
      letter-spacing: 0.5px;

      box-shadow:
        0 0 0 1px rgba(0,0,0,0.70) inset,
        0 1px 0 rgba(255,255,255,0.06) inset,
        0 2px 0 rgba(0,0,0,0.55);

      cursor: pointer;
      user-select: none;
    }

    .weekly-back-btn:hover{
      border-color: rgba(240, 91, 41, 1);
    }

    .weekly-back-btn:active{
      transform: translateY(1px);
      box-shadow:
        0 0 0 1px rgba(0,0,0,0.70) inset,
        0 1px 0 rgba(255,255,255,0.06) inset,
        0 1px 0 rgba(0,0,0,0.55);
    }

    .weekly-week-title{
      font-size: var(--font-section-title);
      letter-spacing: 2px;
      color: var(--accent);
      text-shadow: 1px 1px 0 rgba(0,0,0,0.85);

      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .weekly-week-meta{
      font-size: var(--font-small);
      color: var(--text-muted);
      white-space: nowrap;
      text-shadow: 1px 1px 0 rgba(0,0,0,0.85);
    }

    .weekly-week-content-grid{
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(var(--card-w), 1fr));
      gap: var(--space-2);
      justify-items: center;
      align-items: start;
      padding: 0 0 8px;
      box-sizing: border-box;
    }

    .weekly-flip-tile{
      width: 100%;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      min-width: 0;
      box-sizing: border-box;
    }
  `;

  document.head.appendChild(style);
}

function elementFromHtml(html) {
  const tpl = document.createElement('template');
  tpl.innerHTML = String(html || '').trim();
  return tpl.content.firstElementChild;
}

function findMemberSpriteExtByName(memberName, membersData) {
  const target = normalize(memberName);
  if (!target) return null;

  const list = Array.isArray(membersData) ? membersData : [];
  const match = list.find(m => normalize(m && m.name) === target);

  const ext = match && match.sprite ? String(match.sprite).trim() : '';
  return ext || null;
}

function spriteSrcForMemberName(memberName, membersData) {
  const key = normalize(memberName);
  const ext = findMemberSpriteExtByName(memberName, membersData);

  if (key && ext) return `img/membersprites/${key}sprite.${ext}`;
  return 'img/membersprites/examplesprite.png';
}

function prettifyMethod(method) {
  const m = normalize(method);
  if (!m) return '';
  if (m === 'single') return 'Single';
  if (m === 'horde') return 'Horde';
  if (m === 'egg') return 'Egg';
  if (m === 'surf') return 'Surf';
  return String(method).trim();
}

function buildShinyInfoText(mon) {
  const m = mon || {};
  const parts = [];

  if (m.lost) parts.push('Lost');

  const methodRaw = m.method ? String(m.method) : '';
  const isSafari = normalize(methodRaw) === 'safari' || Boolean(m.safari);
  const method = prettifyMethod(methodRaw);

  if (method && !isSafari) parts.push(method);

  if (m.secret) parts.push('Secret');
  if (m.alpha) parts.push('Alpha');
  if (isSafari) parts.push('Safari');
  if (m.run) parts.push('Run');

  const enc = m.encounter;
  if (enc != null && Number.isFinite(Number(enc)) && Number(enc) > 0) {
    parts.push(`${Number(enc)} Enc`);
  }

  const notes = m.notes ? String(m.notes).trim() : '';
  const isAuto = notes && notes.toUpperCase().includes('AUTO-GENERATED');
  if (notes && !isAuto) parts.push(notes.slice(0, 24));

  return parts.length ? parts.join(' • ') : '—';
}

function buildWeeklyVariantButtons(mon) {
  const info = buildShinyInfoText(mon);

  const isSecret = Boolean(mon && mon.secret);
  const isAlpha = Boolean(mon && mon.alpha);
  const methodRaw = mon && mon.method ? String(mon.method) : '';
  const isSafari = normalize(methodRaw) === 'safari' || Boolean(mon && mon.safari);

  const activeKey = isSecret ? 'secret' : (isAlpha ? 'alpha' : (isSafari ? 'safari' : 'standard'));

  return [
    { key: 'standard', title: 'Standard', enabled: true, active: activeKey === 'standard', infoText: info },
    { key: 'secret', title: 'Secret', enabled: isSecret, active: activeKey === 'secret', infoText: info },
    { key: 'alpha', title: 'Alpha', enabled: isAlpha, active: activeKey === 'alpha', infoText: info },
    { key: 'safari', title: 'Safari', enabled: isSafari, active: activeKey === 'safari', infoText: info }
  ];
}

function pointsForPokemonKey(pokemonKey, pokemonPointsMap) {
  const key = String(pokemonKey || '').trim().toLowerCase();
  if (!key) return 0;

  const map = pokemonPointsMap && typeof pokemonPointsMap === 'object' ? pokemonPointsMap : {};
  const raw = Object.prototype.hasOwnProperty.call(map, key) ? map[key] : 0;

  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

function buildMemberCardElement(memberGroup, membersData) {
  const name = memberGroup && memberGroup.name ? String(memberGroup.name) : '';
  const shinies = Array.isArray(memberGroup && memberGroup.shinies) ? memberGroup.shinies : [];

  const html = renderUnifiedCard({
    cardType: 'member',
    pokemonName: name,
    artSrc: spriteSrcForMemberName(name, membersData),
    infoText: `Shinies: ${shinies.length}`,
    showVariants: false
  });

  return elementFromHtml(html);
}

function buildPokemonCardElement(mon, pokemonPointsMap) {
  const pokemonKey = mon && mon.pokemon ? String(mon.pokemon) : '';
  const points = pointsForPokemonKey(pokemonKey, pokemonPointsMap);

  const html = renderUnifiedCard({
    cardType: 'pokemon',
    pokemonKey,
    pokemonName: prettifyPokemonName(pokemonKey),
    artSrc: getPokemonDbShinyGifSrc(pokemonKey),
    points,
    infoText: buildShinyInfoText(mon),
    isUnclaimed: Boolean(mon && mon.lost),
    variants: buildWeeklyVariantButtons(mon),
    showVariants: true
  });

  return elementFromHtml(html);
}

function sortShiniesDeterministic(shinies) {
  const list = Array.isArray(shinies) ? shinies.slice() : [];
  list.sort((a, b) => {
    const ap = normalize(a && a.pokemon);
    const bp = normalize(b && b.pokemon);
    if (ap < bp) return -1;
    if (ap > bp) return 1;

    const ae = Number(a && a.encounter);
    const be = Number(b && b.encounter);
    const aen = Number.isFinite(ae) ? ae : 0;
    const ben = Number.isFinite(be) ? be : 0;
    if (aen < ben) return -1;
    if (aen > ben) return 1;

    const am = normalize(a && a.method);
    const bm = normalize(b && b.method);
    if (am < bm) return -1;
    if (am > bm) return 1;

    const as = `${normalize(a && a.notes)}|${Boolean(a && a.secret)}|${Boolean(a && a.alpha)}|${Boolean(a && a.safari)}`;
    const bs = `${normalize(b && b.notes)}|${Boolean(b && b.secret)}|${Boolean(b && b.alpha)}|${Boolean(b && b.safari)}`;
    if (as < bs) return -1;
    if (as > bs) return 1;

    return 0;
  });
  return list;
}

function getWeekMemberGroups(week) {
  const membersByOt = week && week.membersByOt && typeof week.membersByOt === 'object' ? week.membersByOt : null;
  const raw = membersByOt ? Object.values(membersByOt) : [];

  return raw.slice().sort((a, b) => {
    const an = normalize(a && a.name);
    const bn = normalize(b && b.name);
    if (an < bn) return -1;
    if (an > bn) return 1;

    const ak = normalize(a && a.key);
    const bk = normalize(b && b.key);
    if (ak < bk) return -1;
    if (ak > bk) return 1;
    return 0;
  });
}

function groupWeeksByMonth(weeksOrdered) {
  const groups = [];
  const byKey = Object.create(null);

  (weeksOrdered || []).forEach(week => {
    const start = getWeekStartDate(week);
    const monthKey = start
      ? `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, '0')}`
      : 'unknown';

    if (!byKey[monthKey]) {
      const title = start ? formatMonthYear(start) : 'Unknown';
      const group = { key: monthKey, title, weeks: [] };
      byKey[monthKey] = group;
      groups.push(group);
    }

    byKey[monthKey].weeks.push(week);
  });

  return groups;
}

function renderStateMessage(container, stateToken, message) {
  installWeeklyStyles();

  container.replaceChildren();

  const root = document.createElement('div');
  root.className = 'weekly-root';
  root.dataset.weeklyState = stateToken;

  const msg = document.createElement('div');
  msg.className = 'weekly-state';
  msg.textContent = message;

  root.appendChild(msg);
  container.appendChild(root);
}

export function renderShinyWeeklyLoading(container) {
  renderStateMessage(container, 'loading', 'Loading weekly data...');
}

export function renderShinyWeeklyError(container, message) {
  const safe = String(message || '').trim();
  renderStateMessage(container, 'error', safe ? `Error loading weekly data: ${safe}` : 'Error loading weekly data.');
}

function buildFlipTile(memberGroup, membersData, pokemonPointsMap) {
  const wrap = document.createElement('div');
  wrap.className = 'weekly-flip-tile';

  const raw = Array.isArray(memberGroup && memberGroup.shinies) ? memberGroup.shinies : [];
  const shinies = sortShiniesDeterministic(raw);

  // -1 => member card, 0..n-1 => pokemon card index
  let cardIndex = -1;

  function renderCurrent() {
    wrap.replaceChildren();

    const card =
      cardIndex === -1
        ? buildMemberCardElement(memberGroup, membersData)
        : buildPokemonCardElement(shinies[cardIndex], pokemonPointsMap);

    if (!card) return;

    wrap.appendChild(card);
  }

  wrap.addEventListener(
    'click',
    (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }

      if (!shinies.length) return;

      cardIndex += 1;
      if (cardIndex >= shinies.length) cardIndex = -1;

      renderCurrent();
    },
    true
  );

  renderCurrent();
  return wrap;
}

function renderOverviewView(state) {
  const root = state.root;
  root.replaceChildren();

  const monthGroups = groupWeeksByMonth(state.orderedWeeks);

  monthGroups.forEach(group => {
    const month = document.createElement('div');
    month.className = 'weekly-overview-month';

    const title = document.createElement('h3');
    title.className = 'weekly-overview-month-title';
    title.textContent = group.title;

    const grid = document.createElement('div');
    grid.className = 'weekly-week-grid';

    group.weeks.forEach(week => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'weekly-week-tile';

      const weekKey = week && week.week ? String(week.week) : '';
      btn.dataset.weekKey = weekKey;

      const label = document.createElement('div');
      label.className = 'weekly-week-label';
      label.textContent = formatWeekShortLabel(week);

      const stats = document.createElement('div');
      stats.className = 'weekly-week-stats';
      const shinyCount = Number(week && week.shinyCount) || 0;
      const hunterCount = Number(week && week.hunterCount) || 0;
      stats.textContent = `${shinyCount} Shinies • ${hunterCount} Hunters`;

      btn.append(label, stats);

      btn.addEventListener('click', () => {
        const idx = state.orderedWeeks.findIndex(w => String(w && w.week) === weekKey);
        if (idx < 0) return;

        state.selectedWeekIndex = idx;
        state.view = 'week';
        state.update();

        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      });

      grid.appendChild(btn);
    });

    month.append(title, grid);
    root.appendChild(month);
  });
}

function renderWeekContentView(state) {
  const root = state.root;
  root.replaceChildren();

  const week = state.orderedWeeks[state.selectedWeekIndex] || null;

  const header = document.createElement('div');
  header.className = 'weekly-week-header';

  const left = document.createElement('div');
  left.className = 'weekly-week-header-left';

  const backBtn = document.createElement('button');
  backBtn.type = 'button';
  backBtn.className = 'weekly-back-btn';
  backBtn.textContent = 'Back to Overview';

  backBtn.addEventListener('click', () => {
    state.view = 'overview';
    state.update();
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  });

  const title = document.createElement('div');
  title.className = 'weekly-week-title';
  title.textContent = week && (week.label || week.week) ? String(week.label || week.week) : 'Week';

  left.append(backBtn, title);

  const meta = document.createElement('div');
  meta.className = 'weekly-week-meta';
  const shinyCount = Number(week && week.shinyCount) || 0;
  const hunterCount = Number(week && week.hunterCount) || 0;
  meta.textContent = `${shinyCount} Shinies • ${hunterCount} Hunters`;

  header.append(left, meta);

  const content = document.createElement('div');

  const memberGroups = getWeekMemberGroups(week).filter(g => {
    const shinies = Array.isArray(g && g.shinies) ? g.shinies : [];
    return shinies.length > 0;
  });

  if (!memberGroups.length) {
    const msg = document.createElement('div');
    msg.className = 'weekly-state';
    msg.textContent = 'No shinies for this week.';
    content.appendChild(msg);

    root.append(header, content);
    return;
  }

  const grid = document.createElement('div');
  grid.className = 'weekly-week-content-grid';

  memberGroups.forEach(group => {
    const tile = buildFlipTile(group, state.membersData, state.pokemonPointsMap);
    if (!tile) return;
    grid.appendChild(tile);
  });

  content.appendChild(grid);
  root.append(header, content);
}

export function renderShinyWeekly(weeks, container, membersData = [], pokemonPointsMap = {}) {
  installWeeklyStyles();

  const list = Array.isArray(weeks) ? weeks : [];

  if (!list.length) {
    renderStateMessage(container, 'empty', 'No weekly data.');
    return;
  }

  // UI wants newest week first.
  const orderedWeeks = list.slice().reverse();

  container.replaceChildren();

  const root = document.createElement('div');
  root.className = 'weekly-root';
  container.appendChild(root);

  const state = {
    view: 'overview',
    selectedWeekIndex: -1,
    orderedWeeks,
    membersData: Array.isArray(membersData) ? membersData : [],
    pokemonPointsMap: pokemonPointsMap && typeof pokemonPointsMap === 'object' ? pokemonPointsMap : {},
    root,
    update: () => {
      if (state.view === 'week') {
        renderWeekContentView(state);
        return;
      }
      renderOverviewView(state);
    }
  };

  state.update();
}
