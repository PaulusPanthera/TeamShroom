// src/features/home/home.page.js
// v2.0.0-beta
// Router-ready Home page entry (HQ widgets: Next Event, Bounty, HotW)

import { fetchHomeViewModel } from './home.js';
import { renderLoading, renderError, renderContent } from './home.ui.js';

function assertValidRoot(root) {
  if (!root || !(root instanceof Element)) {
    throw new Error('HOME_INVALID_ROOT');
  }
}

function safeText(value, fallback = '') {
  if (value == null) return fallback;
  const s = String(value).trim();
  return s.length ? s : fallback;
}

function setSidebarCopy(sidebar) {
  if (!sidebar) return;

  if (typeof sidebar.setTitle === 'function') {
    sidebar.setTitle('GUILD HQ');
  }

  if (typeof sidebar.setHint === 'function') {
    sidebar.setHint('Event link, bounty target, and hunter spotlight.');
  }
}

function renderSidebarSummary(sidebar, vm) {
  if (!sidebar || typeof sidebar.setSections !== 'function') return;

  const wrap = document.createElement('div');

  const e = vm?.nextEvent;
  const b = vm?.bounty;
  const h = vm?.hotw;

  const line1 = document.createElement('div');
  line1.textContent = `Event: ${safeText(e?.timeText, '-')}`;

  const line2 = document.createElement('div');
  line2.textContent = `Bounty: ${safeText(b?.targetText, '-')}`;

  const line3 = document.createElement('div');
  line3.textContent = `HotW: ${safeText(h?.nameText, '-')}`;

  wrap.append(line1, line2, line3);
  sidebar.setSections([{ label: '', node: wrap }]);
}

export async function renderHomePage(ctx) {
  const root = ctx?.root;
  const sidebar = ctx?.sidebar;
  const preloadedRows = ctx?.params?.rows;

  assertValidRoot(root);

  renderLoading(root);
  setSidebarCopy(sidebar);

  try {
    const vm = await fetchHomeViewModel(preloadedRows);
    renderContent(root, vm);
    renderSidebarSummary(sidebar, vm);
  } catch {
    renderError(root);

    if (sidebar && typeof sidebar.setSections === 'function') {
      const fail = document.createElement('div');
      fail.textContent = 'Failed to load Home widgets.';
      sidebar.setSections([{ label: '', node: fail }]);
    }
  }
}
