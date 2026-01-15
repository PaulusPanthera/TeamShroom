// src/features/donators/donators.ui.js
// v2.0.0-beta
// Donators UI renderer (leaderboard + recent donations, pixel style)
const STYLE_ID = 'donators-style-v2';

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;

  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = `
.donators-root {
  padding: 10px;
}

.donators-main {
  display: flex;
  flex-direction: row;
  gap: 16px;
  overflow-x: auto;
  align-items: flex-start;
}

.donators-leaderboard,
.donators-recent,
.donators-status {
  background: rgba(12,16,20,0.72);
  border: 3px solid rgba(0,0,0,0.9);
  box-shadow: 0 0 0 2px rgba(58,70,81,0.95) inset, 0 8px 0 rgba(0,0,0,0.55);
  padding: 10px;
  flex: 1 1 auto;
  min-width: 420px;
}

.donators-leaderboard h2,
.donators-recent h2,
.donators-status h2 {
  font-size: 16px;
  text-transform: uppercase;
  color: var(--text-main);
  border-bottom: 2px solid rgba(58,70,81,0.85);
  margin: 0 0 10px 0;
  padding-bottom: 6px;
}

.donators-status-body {
  font-size: 13px;
  color: var(--text-main);
  border: 2px solid rgba(58,70,81,0.85);
  background: rgba(0,0,0,0.22);
  box-shadow: 0 0 0 1px rgba(0,0,0,0.65) inset;
  padding: 10px;
}

.donators-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.donators-table th,
.donators-table td {
  padding: 8px;
  font-size: 13px;
  border-bottom: 1px solid rgba(58,70,81,0.55);
  color: var(--text-main);
}

.donators-table th {
  color: var(--text-muted);
  text-transform: uppercase;
  font-size: 12px;
}

.donators-table tbody tr:nth-child(even) td {
  background: rgba(0,0,0,0.12);
}

.donators-table tbody tr:hover td {
  box-shadow: inset 0 0 0 2px rgba(240,91,41,0.82);
}

.donators-recent-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.donators-recent-item {
  display: grid;
  grid-template-columns: 80px 1fr 90px;
  gap: 6px;
  padding: 6px;
  border: 2px solid rgba(58,70,81,0.85);
  background: rgba(0,0,0,0.22);
  font-size: 12px;
}

.donators-recent-date {
  color: var(--text-muted);
  white-space: nowrap;
}

.donators-recent-name {
  color: var(--text-main);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.donators-type {
  border: 2px solid rgba(58,70,81,0.85);
  padding: 1px 4px;
  font-size: 10px;
  text-transform: uppercase;
  margin-left: 6px;
}

.donators-type--item {
  border-color: rgba(240,91,41,0.92);
}

.donators-type--money {
  border-color: rgba(170,210,255,0.85);
}

.donators-recent-value {
  color: var(--success);
  text-align: right;
  white-space: nowrap;
}
  `.trim();

  document.head.appendChild(s);
}

function el(tag, cls, txt) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (txt !== undefined && txt !== null) n.textContent = String(txt);
  return n;
}

function safeText(v, fallback = '-') {
  if (v === undefined || v === null) return fallback;
  const s = String(v);
  return s.length ? s : fallback;
}

function getPageContent() {
  return document.getElementById('page-content');
}

function renderLeaderboard(vm) {
  const ranked = Array.isArray(vm?.ranked) ? vm.ranked : [];

  const panel = el('section', 'donators-leaderboard');
  panel.appendChild(el('h2', '', 'Leaderboard'));

  const tbl = el('table', 'donators-table');
  tbl.setAttribute('aria-label', 'Donators leaderboard');

  const thead = document.createElement('thead');
  const hr = document.createElement('tr');
  ['Rank', 'Donator', 'Total', 'Tier'].forEach((h) => hr.appendChild(el('th', '', h)));
  thead.appendChild(hr);
  tbl.appendChild(thead);

  const tb = document.createElement('tbody');
  ranked.forEach((d) => {
    const tr = document.createElement('tr');

    tr.appendChild(el('td', '', safeText(d?.placementText, '-')));
    tr.appendChild(el('td', '', safeText(d?.name, 'Unknown')));
    tr.appendChild(el('td', '', safeText(d?.totalText, '-')));
    tr.appendChild(el('td', '', safeText(d?.tierMeta?.label, '-')));

    tb.appendChild(tr);
  });

  tbl.appendChild(tb);
  panel.appendChild(tbl);

  return panel;
}

function renderRecent(vm) {
  const recent = Array.isArray(vm?.recent) ? vm.recent : [];

  const panel = el('section', 'donators-recent');
  panel.appendChild(el('h2', '', 'Recent Donations'));

  const list = el('div', 'donators-recent-list');

  recent.forEach((r) => {
    const item = el('div', 'donators-recent-item');

    item.appendChild(el('div', 'donators-recent-date', safeText(r?.dateText, '-')));

    const name = el('div', 'donators-recent-name', safeText(r?.name, 'Unknown'));

    const isItem = Boolean(r?.isItem);
    const typeCls = `donators-type ${isItem ? 'donators-type--item' : 'donators-type--money'}`;
    const type = el('span', typeCls, safeText(r?.typeLabel, isItem ? 'Item' : 'Money'));
    name.appendChild(type);

    item.appendChild(name);
    item.appendChild(el('div', 'donators-recent-value', safeText(r?.valueText, '-')));

    list.appendChild(item);
  });

  panel.appendChild(list);
  return panel;
}

function renderStatusPanel(titleText, bodyText) {
  const panel = el('section', 'donators-status');
  panel.appendChild(el('h2', '', titleText));
  panel.appendChild(el('div', 'donators-status-body', bodyText));
  return panel;
}

export function renderDonatorsPage(vm) {
  ensureStyles();

  const c = getPageContent();
  if (!c) return;

  c.replaceChildren();

  const root = el('div', 'donators-root');
  const main = el('div', 'donators-main');

  main.appendChild(renderLeaderboard(vm));
  main.appendChild(renderRecent(vm));

  root.appendChild(main);
  c.appendChild(root);
}

export function renderDonatorsLoading() {
  ensureStyles();

  const c = getPageContent();
  if (!c) return;

  c.replaceChildren();

  const root = el('div', 'donators-root');
  const main = el('div', 'donators-main');

  const panel = renderStatusPanel('Loading', 'Fetching donators data...');
  panel.setAttribute('role', 'status');
  panel.setAttribute('aria-live', 'polite');

  main.appendChild(panel);

  root.appendChild(main);
  c.appendChild(root);
}

export function renderDonatorsError(message) {
  ensureStyles();

  const c = getPageContent();
  if (!c) return;

  c.replaceChildren();

  const root = el('div', 'donators-root');
  const main = el('div', 'donators-main');

  main.appendChild(renderStatusPanel('Error', safeText(message, 'Failed to load donators data.')));

  root.appendChild(main);
  c.appendChild(root);
}
