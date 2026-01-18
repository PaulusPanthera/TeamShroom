// src/features/donators/donators.ui.js
// v2.0.0-beta
// DOM-safe UI rendering for Donators presenter view model (leaderboard + recent panels).

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

function safeText(value, fallback = '') {
  if (value == null) return fallback;
  const s = String(value);
  return s.length ? s : fallback;
}

function createPageRoot(root) {
  const page = el('div', 'donators-root');
  root.appendChild(page);
  return page;
}

function createMain(page) {
  const main = el('div', 'donators-main');
  page.appendChild(main);
  return main;
}

function createPanel(titleText, extraClass) {
  const panel = el('section', `ts-panel donators-panel ${extraClass || ''}`.trim());
  const title = el('div', 'ts-panel-title donators-panel-title', titleText);
  panel.appendChild(title);
  return panel;
}

function renderSummary(page, summary) {
  if (!summary) return;

  const donors = safeText(summary.totalDonorsText, '0');
  const donated = safeText(summary.totalDonatedText, '0');

  const line = el('div', 'donators-summary');
  line.textContent = `Total Donors: ${donors} • Total Donated: ${donated}`;
  page.appendChild(line);
}

function renderLeaderboard(panel, leaderboard) {
  const list = Array.isArray(leaderboard) ? leaderboard : [];

  const table = el('table', 'donators-table');
  table.setAttribute('aria-label', 'Donators leaderboard');

  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');

  const headings = [
    { label: 'Rank', className: 'donators-cell-rank' },
    { label: 'Donator', className: 'donators-cell-name' },
    { label: 'Total', className: 'donators-cell-total' },
    { label: 'Tier', className: 'donators-cell-tier' }
  ];

  headings.forEach(({ label, className }) => {
    const th = document.createElement('th');
    th.className = `donators-cell ${className}`.trim();
    th.textContent = label;
    headRow.appendChild(th);
  });

  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');

  if (!list.length) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 4;
    td.className = 'donators-empty';
    td.textContent = 'No leaderboard data.';
    tr.appendChild(td);
    tbody.appendChild(tr);
  } else {
    list.forEach((entry) => {
      const tr = document.createElement('tr');
      tr.className = 'donators-row';

      const tdRank = document.createElement('td');
      tdRank.className = 'donators-cell donators-cell-rank';
      tdRank.textContent = safeText(entry?.placementText, '-');

      const tdName = document.createElement('td');
      tdName.className = 'donators-cell donators-cell-name';
      tdName.textContent = safeText(entry?.nameText, 'Unknown');

      const tdTotal = document.createElement('td');
      tdTotal.className = 'donators-cell donators-cell-total';
      tdTotal.textContent = safeText(entry?.totalText, '0');

      const tdTier = document.createElement('td');
      tdTier.className = 'donators-cell donators-cell-tier';
      tdTier.textContent = safeText(entry?.tierLabel, 'Supporter');

      tr.append(tdRank, tdName, tdTotal, tdTier);
      tbody.appendChild(tr);
    });
  }

  table.appendChild(tbody);
  panel.appendChild(table);
}

function makeTypeTag({ isItem }) {
  const label = isItem ? 'ITEM' : 'POKEYEN';
  const cls = `donators-type-tag ${isItem ? 'donators-type-tag--item' : 'donators-type-tag--money'}`;
  return el('span', cls, `[${label}]`);
}

function renderRecent(panel, recent) {
  const list = Array.isArray(recent) ? recent : [];
  const host = el('div', 'donators-recent-list');

  if (!list.length) {
    host.appendChild(el('div', 'donators-empty', 'No recent donations.'));
    panel.appendChild(host);
    return;
  }

  list.forEach((entry) => {
    const isItem = Boolean(entry?.isItem);

    const row = el('div', 'donators-recent-item');

    const date = el('div', 'donators-recent-date', safeText(entry?.dateText, '-'));

    const nameWrap = el('div', 'donators-recent-name');
    const nameText = el('span', 'donators-recent-name-text', safeText(entry?.nameText, 'Unknown'));
    nameWrap.appendChild(nameText);
    nameWrap.appendChild(makeTypeTag({ isItem }));

    const value = el('div', 'donators-recent-value', safeText(entry?.valueText, '0'));

    row.append(date, nameWrap, value);
    host.appendChild(row);
  });

  panel.appendChild(host);
}

function renderStatus(root, title, message) {
  clearNode(root);

  const page = createPageRoot(root);
  const main = createMain(page);

  const panel = createPanel(title, 'donators-status');
  const body = el('div', 'donators-status-body', message);

  panel.appendChild(body);
  main.appendChild(panel);
}

export function renderLoading(root) {
  renderStatus(root, 'Loading', 'Fetching donators data...');
}

export function renderError(root) {
  renderStatus(root, 'Error', 'Failed to load donators.');
}

export function renderContent(root, viewModel) {
  clearNode(root);

  const vm = viewModel && typeof viewModel === 'object' ? viewModel : {};
  const page = createPageRoot(root);

  renderSummary(page, vm.summary);

  const main = createMain(page);

  const leaderboardPanel = createPanel('Leaderboard', 'donators-leaderboard');
  renderLeaderboard(leaderboardPanel, vm.leaderboard);

  const recentPanel = createPanel('Recent Donations', 'donators-recent');
  renderRecent(recentPanel, vm.recent);

  main.append(leaderboardPanel, recentPanel);
}
