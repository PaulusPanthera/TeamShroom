// src/features/home/home.page.js
// v2.0.0-beta
// Router-ready Home page entry (HQ widgets: Next Event, Bounty, HotW, Spotlight)

import { fetchHomeViewModel } from './home.js';
import { renderLoading, renderError, renderContent } from './home.ui.js';

function assertValidRoot(root) {
  if (!root || !(root instanceof Element)) {
    throw new Error('HOME_INVALID_ROOT');
  }
}

function setSidebarCopy(sidebar) {
  if (!sidebar) return;

  if (typeof sidebar.setTitle === 'function') {
    sidebar.setTitle('GUILD HQ');
  }

  if (typeof sidebar.setHint === 'function') {
    sidebar.setHint('Event info, bounty target, and hunter spotlight.');
  }

  // Ensure prior feature sidebar content is cleared.
  if (typeof sidebar.setSections === 'function') {
    sidebar.setSections([]);
  }
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
    renderContent(root, vm, { signal: ctx?.signal });
  } catch {
    renderError(root);

    if (sidebar && typeof sidebar.setSections === 'function') {
      const fail = document.createElement('div');
      fail.textContent = 'Failed to load Home widgets.';
      sidebar.setSections([{ label: '', node: fail }]);
    }
  }
}
