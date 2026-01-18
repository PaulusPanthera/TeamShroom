// src/features/donators/donators.page.js
// v2.0.0-beta
// Router-ready Donators page entry (static data load -> presenter -> render + sidebar blocks).

import { fetchDonatorsViewModel } from './donators.js';
import { renderLoading, renderError, renderContent } from './donators.ui.js';

function assertValidRoot(root) {
  if (!root || !(root instanceof Element)) {
    throw new Error('DONATORS_INVALID_ROOT');
  }
}

function safeText(value, fallback = '-') {
  if (value == null) return fallback;
  const s = String(value).trim();
  return s.length ? s : fallback;
}

function makeLines(lines) {
  const wrap = document.createElement('div');
  wrap.className = 'ts-subbar-stats';

  const list = Array.isArray(lines) ? lines : [];
  list.forEach((text) => {
    const line = document.createElement('div');
    line.textContent = String(text || '').trim();
    wrap.appendChild(line);
  });

  return wrap;
}

function setSidebarHeader(sidebar) {
  if (!sidebar) return;

  if (typeof sidebar.setTitle === 'function') {
    sidebar.setTitle('DONATORS');
  }

  if (typeof sidebar.setHint === 'function') {
    sidebar.setHint('Support ledger. Top donators, totals, and recent support.');
  }
}

function renderSidebarBlocks(sidebar, viewModel) {
  if (!sidebar || typeof sidebar.setSections !== 'function') return;

  const vm = viewModel && typeof viewModel === 'object' ? viewModel : {};
  const summary = vm.summary || {};

  const donors = safeText(summary.totalDonorsText, '0');
  const donated = safeText(summary.totalDonatedText, '0');

  const recent = Array.isArray(vm.recent) && vm.recent.length ? vm.recent[0] : null;
  const recentName = safeText(recent && recent.nameText, '-');
  const recentValue = safeText(recent && recent.valueText, '-');
  const recentTag = recent && recent.isItem ? '[ITEM]' : '[POKEYEN]';

  const statusNode = makeLines([
    `Donators: ${donors}`,
    `Total Given: ${donated}`,
    `Latest: ${recentName} ${recentTag} • ${recentValue}`
  ]);

  const controlsNode = makeLines([
    'View leaderboard',
    'View recent donations',
    'Prize pool (planned)'
  ]);

  const notesNode = makeLines([
    'Support keeps events and prizes going.',
    'Ranks are lifetime totals.'
  ]);

  sidebar.setSections([
    { label: 'STATUS', node: statusNode },
    { label: 'CONTROLS', node: controlsNode },
    { label: 'NOTES', node: notesNode }
  ]);
}

export async function renderDonatorsPage(ctx) {
  const root = ctx && ctx.root;
  const sidebar = ctx && ctx.sidebar;
  const preloadedRows = ctx && ctx.params && ctx.params.rows;

  assertValidRoot(root);

  // No CSS injection here. Donators relies exclusively on style/donators.css.
  renderLoading(root);

  setSidebarHeader(sidebar);
  renderSidebarBlocks(sidebar, null);

  try {
    const viewModel = await fetchDonatorsViewModel(preloadedRows);
    renderContent(root, viewModel);
    renderSidebarBlocks(sidebar, viewModel);
  } catch {
    renderError(root);

    if (sidebar && typeof sidebar.setSections === 'function') {
      const fail = document.createElement('div');
      fail.textContent = 'Failed to load donators.';
      sidebar.setSections([{ label: '', node: fail }]);
    }
  }
}
