// src/features/donators/donators.ui.js
// Donators — UI renderer (DOM-only, stable)

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = String(text);
  return node;
}

function renderEmptyState(message) {
  const wrap = el('div', 'donators-empty');
  wrap.textContent = String(message || 'No donation data.');
  return wrap;
}

function renderHowToDonatePanel() {
  const panel = el('section', 'donators-panel donators-panel--howto');

  const title = el('h2', 'donators-panel-title', 'How to Donate');
  panel.appendChild(title);

  const body = el('div', 'donators-panel-body');
  const text = el('div', 'donators-howto-text');
  text.textContent = 'Send Pokéyen or items via in-game mail in PokeMMO to:';

  const highlight = el('div', 'donators-highlight', 'TeamShroomBank');

  body.appendChild(text);
  body.appendChild(highlight);
  panel.appendChild(body);

  return panel;
}

function renderSummaryPanel(summary) {
  const panel = el('section', 'donators-panel donators-panel--summary');

  const title = el('h2', 'donators-panel-title', 'Totals');
  panel.appendChild(title);

  const body = el('div', 'donators-panel-body');

  const grid = el('div', 'donators-summary-grid');

  const donors = el('div', 'donators-summary-stat');
  donors.appendChild(el('div', 'donators-summary-label', 'Donators'));
  donors.appendChild(el('div', 'donators-summary-value', summary && summary.totalDonorsText ? summary.totalDonorsText : '0'));

  const total = el('div', 'donators-summary-stat');
  total.appendChild(el('div', 'donators-summary-label', 'Total Donated'));
  total.appendChild(el('div', 'donators-summary-value donators-summary-value--accent', summary && summary.totalDonatedText ? summary.totalDonatedText : '0'));

  grid.appendChild(donors);
  grid.appendChild(total);

  body.appendChild(grid);
  panel.appendChild(body);

  return panel;
}

function renderTierLegendPanel(tiers) {
  const panel = el('section', 'donators-panel donators-panel--tiers');

  const title = el('h2', 'donators-panel-title', 'Tiers');
  panel.appendChild(title);

  const body = el('div', 'donators-panel-body');
  const list = el('div', 'donators-tier-legend');

  (Array.isArray(tiers) ? tiers : []).forEach(t => {
    const row = el('div', `donators-tier-row donators-tier-row--${t.tierKey || 'none'}`);

    const left = el('div', 'donators-tier-left');
    if (t.icon) {
      const img = document.createElement('img');
      img.className = 'donators-tier-icon';
      img.src = t.icon;
      img.alt = '';
      left.appendChild(img);
    }

    left.appendChild(el('div', 'donators-tier-label', t.label || '—'));

    const right = el('div', 'donators-tier-right');
    right.appendChild(el('div', 'donators-tier-count', t.countText || '0'));

    const desc = t.desc ? el('div', 'donators-tier-desc', t.desc) : null;

    row.appendChild(left);
    row.appendChild(right);
    if (desc) row.appendChild(desc);

    list.appendChild(row);
  });

  body.appendChild(list);
  panel.appendChild(body);

  return panel;
}

function renderLastDonationsPanel(recent) {
  const panel = el('section', 'donators-panel donators-panel--recent');

  const title = el('h2', 'donators-panel-title', 'Last Donations');
  panel.appendChild(title);

  const body = el('div', 'donators-panel-body');

  const tableWrap = el('div', 'donators-table-wrap');
  const table = el('table', 'donators-recent-table');

  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  ['Date', 'Donator', 'Donation', 'Value'].forEach(h => {
    headerRow.appendChild(el('th', '', h));
  });
  thead.appendChild(headerRow);

  const tbody = document.createElement('tbody');

  const items = Array.isArray(recent) ? recent : [];
  if (!items.length) {
    const tr = document.createElement('tr');
    const td = el('td', 'donators-empty-row', 'No recent donations.');
    td.colSpan = 4;
    tr.appendChild(td);
    tbody.appendChild(tr);
  } else {
    items.forEach(d => {
      const tr = document.createElement('tr');

      tr.appendChild(el('td', '', d.dateText));
      tr.appendChild(el('td', '', d.name));

      const donationTd = el('td', d.isItemDonation ? 'donators-recent-item' : 'donators-recent-currency', d.donation);
      tr.appendChild(donationTd);

      const valueTd = el('td', 'donators-number', d.valueText);
      tr.appendChild(valueTd);

      tbody.appendChild(tr);
    });
  }

  table.appendChild(thead);
  table.appendChild(tbody);
  tableWrap.appendChild(table);

  body.appendChild(tableWrap);
  panel.appendChild(body);

  return panel;
}

function renderRankedDonatorsTable(ranked) {
  const panel = el('section', 'donators-panel donators-panel--ranked');

  const title = el('h2', 'donators-panel-title', 'Donators');
  panel.appendChild(title);

  const body = el('div', 'donators-panel-body');

  const tableWrap = el('div', 'donators-table-wrap');
  const table = el('table', 'donators-ranked-table');

  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  ['#', 'Donator', 'Total Donated', 'Tier'].forEach(h => {
    headerRow.appendChild(el('th', '', h));
  });
  thead.appendChild(headerRow);

  const tbody = document.createElement('tbody');

  (Array.isArray(ranked) ? ranked : []).forEach(d => {
    const tierKey = d && d.tierKey ? String(d.tierKey) : 'none';
    const tr = el('tr', `donators-row donators-row--${tierKey}`);

    const placement = el('td', 'donators-placement', d.placementText);

    const nameTd = el('td', 'donators-name');
    if (d.tierMeta && d.tierMeta.icon) {
      const img = document.createElement('img');
      img.className = 'donators-tier-icon';
      img.src = d.tierMeta.icon;
      img.alt = '';
      nameTd.appendChild(img);
    }
    nameTd.appendChild(el('span', 'donators-name-text', d.name));

    const totalTd = el('td', 'donators-number', d.totalText);

    const tierTd = el('td', 'donators-tier-cell');
    tierTd.tabIndex = 0;

    const tierLabel = el('span', 'donators-tier-pill', d.tierMeta && d.tierMeta.label ? d.tierMeta.label : '—');
    tierTd.appendChild(tierLabel);

    if (d.tierMeta && d.tierMeta.desc) {
      const tip = el('span', 'donators-tooltip', d.tierMeta.desc);
      tierTd.appendChild(tip);
    }

    tr.appendChild(placement);
    tr.appendChild(nameTd);
    tr.appendChild(totalTd);
    tr.appendChild(tierTd);

    tbody.appendChild(tr);
  });

  table.appendChild(thead);
  table.appendChild(tbody);
  tableWrap.appendChild(table);

  body.appendChild(tableWrap);
  panel.appendChild(body);

  return panel;
}

export function renderDonatorsPage(viewModel) {
  const content = document.getElementById('page-content');
  if (!content) return;

  content.replaceChildren();

  if (!viewModel || !viewModel.hasData) {
    content.appendChild(renderEmptyState('No donation data.'));
    return;
  }

  const root = el('div', 'donators-root');

  const top = el('div', 'donators-top-flex');
  top.appendChild(renderHowToDonatePanel());
  top.appendChild(renderSummaryPanel(viewModel.summary));
  top.appendChild(renderLastDonationsPanel(viewModel.recent));

  root.appendChild(top);

  const mid = el('div', 'donators-mid-flex');
  mid.appendChild(renderTierLegendPanel(viewModel.tiers));
  root.appendChild(mid);

  root.appendChild(renderRankedDonatorsTable(viewModel.ranked));

  content.appendChild(root);
}
