// main.js
// v2.0.0-beta
// App entry routing + global header + page bootstrapping

import { renderPage } from './src/app/render.js';

window.addEventListener('hashchange', renderPage);

// Module scripts behave like "defer" and may execute before DOMContentLoaded.
// Use a single-shot bootstrap to avoid double initial renders.
if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', renderPage, { once: true });
} else {
  renderPage();
}
