// src/features/donators/donators.js
// Donators — page controller

import { buildDonatorsViewModel } from './donators.presenter.js';
import { renderDonatorsPage } from './donators.ui.js';

export function setupDonatorsPage({ donatorsRows }) {
  const vm = buildDonatorsViewModel(donatorsRows);
  renderDonatorsPage(vm);
}
