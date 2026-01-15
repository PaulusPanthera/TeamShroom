// src/features/shinyweekly/shinyweekly.page.js
// v2.0.0-beta
// Shiny Weekly page controller

import { renderShinyWeekly } from './shinyweekly.ui.js';
import { buildShinyWeeklyModel } from '../../data/shinyweekly.model.js';
import { initPokemonDerivedDataOnce, getPokemonPointsMap } from '../../domains/pokemon/pokemon.data.js';

export function setupShinyWeeklyPage({ weeklyModel, membersRows } = {}) {
  const root = document.getElementById('page-content');
  if (!root) return;

  const input = Array.isArray(weeklyModel) ? weeklyModel : [];
  const weeks = (input.length && !Object.prototype.hasOwnProperty.call(input[0], 'membersByOt'))
    ? buildShinyWeeklyModel(input)
    : input;
  const members = Array.isArray(membersRows) ? membersRows : [];

  // Weekly needs Pokémon points to resolve tier trim + header points chip.
  // Load derived Pokémon data locally to avoid global route coupling.
  root.replaceChildren();

  const loadingRoot = document.createElement('div');
  loadingRoot.className = 'weekly-calendar-root';

  const loadingPanel = document.createElement('div');
  loadingPanel.className = 'weekly-calendar-panel';
  loadingPanel.textContent = 'Loading Pokémon data...';

  loadingRoot.appendChild(loadingPanel);
  root.appendChild(loadingRoot);

  initPokemonDerivedDataOnce()
    .then(() => {
      renderShinyWeekly(weeks, root, members, getPokemonPointsMap());
    })
    .catch(() => {
      // Fall back to rendering without tiers so the page remains usable.
      renderShinyWeekly(weeks, root, members, {});

      const warning = document.createElement('div');
      warning.className = 'weekly-calendar-panel';
      warning.textContent = 'Failed to load Pokémon data. Weekly tiers are unavailable.';

      const weeklyRoot = root.querySelector('.weekly-calendar-root');
      if (weeklyRoot) weeklyRoot.prepend(warning);
    });
}
