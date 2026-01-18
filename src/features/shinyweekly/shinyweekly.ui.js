// src/features/shinyweekly/shinyweekly.ui.js
// v2.0.0-beta
// ShinyWeekly UI rendering helpers. Overview (month/week tiles) + week detail (flip tiles cycling member + shinies).

import { prettifyPokemonName, getPokemonDbShinyGifSrc } from '../../utils/utils.js';

function clearNode(node) {
  if (!node) return;
  node.replaceChildren();
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = String(text);
  return node;
}

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

function getWeekStartDate(week) {
  return parseIsoDate(week && week.dateStart);
}

function getWeekEndDate(week) {
  return parseIsoDate(week && week.dateEnd);
}

function formatMonthYear(dt) {
  if (!dt) return 'Unknown';
  const month = MONTH_NAMES[dt.getUTCMonth()] || 'Unknown';
  const year = dt.getUTCFullYear();
  return `${month} ${year}`;
}

function formatShortMonth(dt) {
  if (!dt) return '';
  const name = MONTH_NAMES[dt.getUTCMonth()] || '';
  return name ? name.slice(0, 3) : '';
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

  const sameMonth =
    start.getUTCMonth() === end.getUTCMonth() && start.getUTCFullYear() === end.getUTCFullYear();

  if (sameMonth) {
    return `${startMonth} ${startDay}–${endDay}`;
  }

  return `${startMonth} ${startDay}–${endMonth} ${endDay}`;
}

function weekSortScoreMs(week) {
  const end = getWeekEndDate(week);
  const start = getWeekStartDate(week);
  const dt = end || start;
  return dt ? dt.getTime() : 0;
}

function sortWeeksNewestFirst(weeks) {
  const list = Array.isArray(weeks) ? weeks.slice() : [];
  list.sort((a, b) => {
    const as = weekSortScoreMs(a);
    const bs = weekSortScoreMs(b);
    if (as !== bs) return bs - as;

    const ak = String((a && a.week) || '');
    const bk = String((b && b.week) || '');
    return bk.localeCompare(ak);
  });
  return list;
}

function groupWeeksByMonth(weeksNewestFirst) {
  const groups = [];
  const byKey = Object.create(null);

  (weeksNewestFirst || []).forEach((week) => {
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

function getMembersSorted(week) {
  if (!week || !week.membersByOt) return [];
  const list = Object.values(week.membersByOt);
  list.sort((a, b) => String(a.name).localeCompare(String(b.name)));
  return list;
}

function spriteSrcForMemberKey(memberKey) {
  const key = normalize(memberKey);
  if (!key) return 'img/symbols/questionmarksprite.png';
  return `img/membersprites/${key}sprite.png`;
}

function classForNameLength(name) {
  const n = String(name || '').trim().length;
  if (n >= 18) return 'is-very-long';
  if (n >= 14) return 'is-long';
  return '';
}

function tierFromPoints(points) {
  const p = Number(points);
  if (!Number.isFinite(p)) return '6';

  if (p >= 100) return 'lm';
  if (p >= 30) return '0';
  if (p >= 25) return '1';
  if (p >= 15) return '2';
  if (p >= 10) return '3';
  if (p >= 6) return '4';
  if (p >= 3) return '5';
  return '6';
}

function getPokemonPoints(pokemonPointsMap, pokemonKey) {
  const key = normalize(pokemonKey);
  if (!key) return 0;
  const map = pokemonPointsMap && typeof pokemonPointsMap === 'object' ? pokemonPointsMap : {};
  const v = Object.prototype.hasOwnProperty.call(map, key) ? map[key] : 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function getPokemonInfoText(mon) {
  if (!mon) return '-';
  if (mon.lost) return 'Lost';
  if (mon.safari) return 'Safari';
  if (mon.secret) return 'Secret';
  if (mon.alpha) return 'Alpha';
  return '-';
}

function renderPokemonCard(mon, pokemonPointsMap, { signal } = {}) {
  const pokemonKey = String((mon && mon.pokemon) || '');
  const pokemonName = prettifyPokemonName(pokemonKey);

  const points = getPokemonPoints(pokemonPointsMap, pokemonKey);
  const tierToken = tierFromPoints(points);
  const tierClass = tierToken === 'lm' ? 'tier-lm' : `tier-${tierToken}`;

  const card = document.createElement('div');
  card.className = ['unified-card', 'unified-card--pokemon', tierClass, mon && mon.lost ? 'is-unclaimed' : '']
    .filter(Boolean)
    .join(' ');

  // Header
  const header = el('div', 'unified-header');

  const nameWrap = el('div', 'unified-name-wrap');
  const nameEl = el('div', ['unified-name', classForNameLength(pokemonName)].filter(Boolean).join(' '), pokemonName);
  nameWrap.appendChild(nameEl);
  header.appendChild(nameWrap);

  if (Number.isFinite(points) && points > 0) {
    const value = el('div', 'unified-value');
    value.setAttribute('aria-label', 'Points');

    const span = el('span', 'unified-value-text', `${points}P`);
    value.appendChild(span);
    header.appendChild(value);
  }

  // Art
  const art = el('div', 'unified-art');
  art.setAttribute('aria-label', 'Art');

  const artImg = document.createElement('img');
  artImg.alt = pokemonName;
  artImg.loading = 'lazy';
  artImg.src = getPokemonDbShinyGifSrc(pokemonKey);

  artImg.addEventListener(
    'error',
    () => {
      artImg.src = 'img/symbols/questionmarksprite.png';
    },
    { signal }
  );

  art.appendChild(artImg);

  // Info
  const info = el('div', 'unified-info');
  info.setAttribute('aria-label', 'Card info');

  const infoTextEl = el('div', 'unified-info-text', getPokemonInfoText(mon));
  info.appendChild(infoTextEl);

  card.append(header, art, info);

  // Variants (static indicators)
  const variants = el('div', 'unified-variants');
  variants.setAttribute('aria-label', 'Variants');

  const flags = {
    standard: true,
    secret: Boolean(mon && mon.secret),
    alpha: Boolean(mon && mon.alpha),
    safari: Boolean(mon && mon.safari)
  };

  const order = [
    { key: 'standard', iconSrc: 'img/symbols/singlesprite.png' },
    { key: 'secret', iconSrc: 'img/symbols/secretshinysprite.png' },
    { key: 'alpha', iconSrc: 'img/symbols/alphasprite.png' },
    { key: 'safari', iconSrc: 'img/symbols/safarisprite.png' }
  ];

  order.forEach((v) => {
    const active = Boolean(flags[v.key]);
    const btn = el('div', ['variant-btn', active ? 'is-active' : 'is-disabled'].join(' '));

    const icon = document.createElement('img');
    icon.src = v.iconSrc;
    icon.alt = '';
    btn.appendChild(icon);
    variants.appendChild(btn);
  });

  card.appendChild(variants);

  return card;
}

function renderMemberCard(memberGroup, { signal } = {}) {
  const name = String((memberGroup && memberGroup.name) || '');
  const key = String((memberGroup && memberGroup.key) || '');

  const card = el('div', 'unified-card unified-card--member');

  // Header
  const header = el('div', 'unified-header');
  const nameWrap = el('div', 'unified-name-wrap');
  const nameEl = el('div', ['unified-name', classForNameLength(name)].filter(Boolean).join(' '), name);
  nameWrap.appendChild(nameEl);
  header.appendChild(nameWrap);

  // Art
  const art = el('div', 'unified-art');
  art.setAttribute('aria-label', 'Art');

  const artImg = document.createElement('img');
  artImg.alt = name;
  artImg.loading = 'lazy';
  artImg.src = spriteSrcForMemberKey(key);

  artImg.addEventListener(
    'error',
    () => {
      artImg.src = 'img/symbols/questionmarksprite.png';
    },
    { signal }
  );

  art.appendChild(artImg);

  // Info plate exists for layout; member modifier hides the text.
  const info = el('div', 'unified-info');
  const infoTextEl = el('div', 'unified-info-text', `Shinies: ${(memberGroup && memberGroup.shinies || []).length}`);
  info.appendChild(infoTextEl);

  card.append(header, art, info);

  return card;
}

function renderFlipTile(memberGroup, pokemonPointsMap, { signal } = {}) {
  const wrap = el('div', 'shinyweekly-flip-tile');

  const shinies = Array.isArray(memberGroup && memberGroup.shinies) ? memberGroup.shinies : [];
  let state = -1;

  const commit = () => {
    clearNode(wrap);

    if (state === -1) {
      wrap.appendChild(renderMemberCard(memberGroup, { signal }));
      return;
    }

    const mon = shinies[state] || null;
    wrap.appendChild(renderPokemonCard(mon, pokemonPointsMap, { signal }));
  };

  wrap.addEventListener(
    'click',
    () => {
      if (!shinies.length) {
        state = -1;
        commit();
        return;
      }

      state += 1;
      if (state >= shinies.length) state = -1;
      commit();
    },
    { signal }
  );

  commit();
  return wrap;
}

export function renderWeeklyShell(root) {
  clearNode(root);

  const page = el('div', 'weekly-root shinyweekly-root');
  const mainBody = el('div', 'shinyweekly-main-body');

  page.append(mainBody);
  root.appendChild(page);

  return { mainBody };
}

export function renderLoading(target, { message } = {}) {
  clearNode(target);
  const wrap = el('div', 'shinyweekly-loading weekly-state');
  wrap.appendChild(el('div', '', message || 'Loading weekly data...'));
  target.appendChild(wrap);
}

export function renderError(target, message) {
  clearNode(target);
  const wrap = el('div', 'shinyweekly-error weekly-state');
  wrap.appendChild(el('div', '', message));
  target.appendChild(wrap);
}

export function renderEmptyState(target, { title, message }) {
  clearNode(target);

  const state = el('div', 'shinyweekly-empty-state');
  const titleEl = el('div', 'shinyweekly-empty-title', title || 'Nothing selected');
  const msgEl = el('div', 'shinyweekly-empty-message', message || '');

  state.append(titleEl, msgEl);
  target.appendChild(state);
}

export function renderOverview(target, { weeks, selectedWeekKey, onSelectWeek } = {}, { signal } = {}) {
  clearNode(target);

  const orderedWeeks = sortWeeksNewestFirst(weeks);
  const groups = groupWeeksByMonth(orderedWeeks);

  if (!groups.length) {
    renderEmptyState(target, {
      title: 'No weekly data',
      message: 'There are no weeks available to display.'
    });
    return;
  }

  const root = el('div', 'shinyweekly-overview');

  groups.forEach((group) => {
    const month = el('div', 'weekly-overview-month');

    const title = el('div', 'weekly-overview-month-title', group.title);
    const grid = el('div', 'weekly-week-grid');

    group.weeks.forEach((week) => {
      const weekKey = String((week && week.week) || '');

      const btn = el('button', 'weekly-week-tile');
      btn.type = 'button';
      btn.dataset.weekKey = weekKey;

      if (selectedWeekKey && weekKey === String(selectedWeekKey)) {
        btn.classList.add('is-selected');
      }

      const label = el('div', 'weekly-week-label', formatWeekShortLabel(week));

      const shinyCount = Number((week && week.shinyCount) || 0) || 0;
      const hunterCount = Number((week && week.hunterCount) || 0) || 0;
      const stats = el('div', 'weekly-week-stats', `${shinyCount} Shinies • ${hunterCount} Hunters`);

      btn.append(label, stats);

      btn.addEventListener(
        'click',
        () => {
          if (typeof onSelectWeek === 'function') onSelectWeek(weekKey);
        },
        { signal }
      );

      grid.appendChild(btn);
    });

    month.append(title, grid);
    root.appendChild(month);
  });

  target.appendChild(root);
}

function renderWeekHeader(target, week, { onBack } = {}, { signal } = {}) {
  const header = el('div', 'shinyweekly-week-header');

  const left = el('div', 'shinyweekly-week-header-left');

  const backBtn = el('button', 'shinyweekly-back-btn', 'Back to Overview');
  backBtn.type = 'button';

  backBtn.addEventListener(
    'click',
    () => {
      if (typeof onBack === 'function') onBack();
    },
    { signal }
  );

  const title = el('div', 'shinyweekly-week-title', week.label || week.week);

  left.append(backBtn, title);

  const right = el('div', 'shinyweekly-week-header-right');

  const shinyCount = Number((week && week.shinyCount) || 0) || 0;
  const hunterCount = Number((week && week.hunterCount) || 0) || 0;

  const meta = el('div', 'shinyweekly-week-meta', `${shinyCount} Shinies • ${hunterCount} Hunters`);

  right.appendChild(meta);

  header.append(left, right);
  target.appendChild(header);
}

export function renderWeekView(
  target,
  { week, pokemonPointsMap, onBack } = {},
  { signal } = {}
) {
  clearNode(target);

  if (!week) {
    renderEmptyState(target, {
      title: 'No week selected',
      message: 'Pick a week from the overview to view details.'
    });
    return;
  }

  renderWeekHeader(target, week, { onBack }, { signal });

  const members = getMembersSorted(week);

  if (!members.length) {
    renderEmptyState(target, {
      title: 'No hunters for this week',
      message: 'This week has no recorded shinies.'
    });
    return;
  }

  const grid = el('div', 'dex-grid');

  members.forEach((memberGroup) => {
    grid.appendChild(renderFlipTile(memberGroup, pokemonPointsMap, { signal }));
  });

  target.appendChild(grid);
}
