// src/features/donators/donators.page.js
// v2.0.0-beta
// Router-ready Donators page entry (static data load -> presenter -> render + sidebar summary).

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

function buildSidebarSummaryNode(viewModel) {
  const vm = viewModel && typeof viewModel === 'object' ? viewModel : {};

  const summary = vm.summary || {};
  const donors = safeText(summary.totalDonorsText, '0');
  const donated = safeText(summary.totalDonatedText, '0');

  const top = Array.isArray(vm.leaderboard) && vm.leaderboard.length ? vm.leaderboard[0] : null;
  const topName = safeText(top && top.nameText, '-');
  const topTotal = safeText(top && top.totalText, '-');

  const recent = Array.isArray(vm.recent) && vm.recent.length ? vm.recent[0] : null;
  const recentDate = safeText(recent && recent.dateText, '-');
  const recentName = safeText(recent && recent.nameText, '-');
  const recentValue = safeText(recent && recent.valueText, '-');
  const recentTag = recent && recent.isItem ? '[ITEM]' : '[POKEYEN]';

  const wrap = document.createElement('div');

  const line1 = document.createElement('div');
  line1.textContent = `Total Donors: ${donors}`;

  const line2 = document.createElement('div');
  line2.textContent = `Total Donated: ${donated}`;

  const line3 = document.createElement('div');
  line3.textContent = `Top Donator: ${topName} • ${topTotal}`;

  const line4 = document.createElement('div');
  line4.textContent = `Recent: ${recentDate} • ${recentName} ${recentTag} • ${recentValue}`;

  wrap.append(line1, line2, line3, line4);
  return wrap;
}

function setSidebarCopy(sidebar) {
  if (!sidebar) return;

  if (typeof sidebar.setTitle === 'function') {
    sidebar.setTitle('DONATOR BOARD');
  }

  if (typeof sidebar.setHint === 'function') {
    sidebar.setHint('Supporters listed here with ranks, totals, and recent contributions.');
  }
}

function renderSidebarSummary(sidebar, viewModel) {
  if (!sidebar || typeof sidebar.setSections !== 'function') return;

  const summaryNode = buildSidebarSummaryNode(viewModel);
  sidebar.setSections([
    { label: '', node: summaryNode }
  ]);
}

export async function renderDonatorsPage(ctx) {
  const root = ctx && ctx.root;
  const sidebar = ctx && ctx.sidebar;
  const preloadedRows = ctx && ctx.params && ctx.params.rows;

  assertValidRoot(root);

  // No CSS injection here. Donators relies exclusively on style/donators.css.
  renderLoading(root);

  setSidebarCopy(sidebar);

  try {
    const viewModel = await fetchDonatorsViewModel(preloadedRows);
    renderContent(root, viewModel);
    renderSidebarSummary(sidebar, viewModel);
  } catch {
    renderError(root);

    if (sidebar && typeof sidebar.setSections === 'function') {
      const fail = document.createElement('div');
      fail.textContent = 'Failed to load donators.';
      sidebar.setSections([{ label: '', node: fail }]);
    }
  }
}
