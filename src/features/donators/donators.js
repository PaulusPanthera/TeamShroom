// src/features/donators/donators.js
// v2.0.0-beta
// Donators page controller (boot + stable loading/error states)

import { buildDonatorsViewModel } from './donators.presenter.js';
import {
  renderDonatorsPage,
  renderDonatorsLoading,
  renderDonatorsError
} from './donators.ui.js';

function isDonatorsRoute() {
  return String(location.hash || '').toLowerCase() === '#donators';
}

function getContentEl() {
  return document.getElementById('page-content');
}

function scheduleLoadingState() {
  if (!isDonatorsRoute()) return;

  // Schedule after the router clears content and starts async fetch.
  setTimeout(() => {
    if (!isDonatorsRoute()) return;

    const content = getContentEl();
    if (!content) return;

    // If real page has already rendered, do nothing.
    const existingRoot = content.querySelector('.donators-root');
    if (existingRoot && !existingRoot.dataset?.donatorsState) return;

    // Only show loading if the container is empty or still in a state view.
    if (content.childElementCount === 0 || content.querySelector('[data-donators-state]')) {
      renderDonatorsLoading();
    }
  }, 0);
}

function showErrorState(err) {
  if (!isDonatorsRoute()) return;

  const content = getContentEl();
  if (!content) return;

  // Only override if we are still loading or empty.
  const stateEl = content.querySelector('[data-donators-state]');
  if (content.childElementCount !== 0 && !stateEl) return;

  const msg = (err && (err.message || err.toString())) ? String(err.message || err.toString()) : '';
  renderDonatorsError(msg);
}

// Loading and error guards without touching global router.
window.addEventListener('hashchange', scheduleLoadingState);
window.addEventListener('DOMContentLoaded', scheduleLoadingState);

// Catch async router failures (fetch/version/JSON issues) when on Donators.
window.addEventListener('unhandledrejection', (e) => {
  showErrorState(e && e.reason);
});

window.addEventListener('error', (e) => {
  // Fallback for non-promise errors.
  showErrorState(e && (e.error || e.message));
});

export function setupDonatorsPage({ donatorsRows }) {
  const vm = buildDonatorsViewModel(donatorsRows);
  renderDonatorsPage(vm);
}
