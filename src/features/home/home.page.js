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
    sidebar.setTitle('GUILD HALL');
  }

  if (typeof sidebar.setHint === 'function') {
    sidebar.setHint("Arrival board. Next event, bounty, last week’s Hunter, spotlight shinies.");
  }
}

function renderSidebarBlocks(sidebar, vm) {
  if (!sidebar || typeof sidebar.setSections !== 'function') return;

  const stats = (vm && vm.stats && typeof vm.stats === 'object') ? vm.stats : {};

  const members = (stats.memberCount != null) ? stats.memberCount : '—';
  const shinies = (stats.totalShinies != null) ? stats.totalShinies : '—';
  const points = (stats.totalPoints != null) ? stats.totalPoints : '—';

  const statusNode = makeLines([
    `Members: ${members}`,
    `Team Shinies: ${shinies}`,
    `Guild Points: ${points}`
  ]);

  const controlsNode = makeLines([
    'View next event',
    'Check bounty target',
    'Open Hunter of the Week',
    'Browse spotlight'
  ]);

  const notesNode = makeLines([
    'Spotlight is hand-picked from the team.',
    'Weekly stats update after reset.'
  ]);

  sidebar.setSections([
    { label: 'STATUS', node: statusNode },
    { label: 'CONTROLS', node: controlsNode },
    { label: 'NOTES', node: notesNode }
  ]);
}

export async function renderHomePage(ctx) {
  const root = ctx?.root;
  const sidebar = ctx?.sidebar;
  const preloadedRows = ctx?.params?.rows;

  assertValidRoot(root);

  renderLoading(root);
  setSidebarHeader(sidebar);

  // Placeholder blocks while loading.
  renderSidebarBlocks(sidebar, null);

  try {
    const vm = await fetchHomeViewModel(preloadedRows);
    renderContent(root, vm, { signal: ctx?.signal });

    // Fill in status numbers if available.
    renderSidebarBlocks(sidebar, vm);
  } catch {
    renderError(root);

    if (sidebar && typeof sidebar.setSections === 'function') {
      const fail = document.createElement('div');
      fail.textContent = 'Failed to load Home widgets.';
      sidebar.setSections([{ label: '', node: fail }]);
    }
  }
}
