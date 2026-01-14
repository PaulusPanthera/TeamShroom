// src/features/shinyweekly/shinyweekly.page.js
// v2.0.0-beta
// Shiny Weekly page controller

import { renderShinyWeekly } from './shinyweekly.ui.js';

export function setupShinyWeeklyPage({ weeklyModel, membersRows } = {}) {
  const root = document.getElementById('page-content');
  if (!root) return;

  const weeks = Array.isArray(weeklyModel) ? weeklyModel : [];
  const members = Array.isArray(membersRows) ? membersRows : [];

  renderShinyWeekly(weeks, root, members);
}
