// src/features/donators/donators.js
// v2.0.0-beta
// Static Donators data wiring (load raw rows -> presenter view model)

import { loadDonators } from '../../data/donators.loader.js';
import { buildDonatorsViewModel } from './donators.presenter.js';

/**
 * Loads /data/donators.json rows via src/data/donators.loader.js.
 * Builds and returns a deterministic presenter view model.
 *
 * If `rowsOverride` is an array, it is used instead of fetching.
 */
export async function fetchDonatorsViewModel(rowsOverride) {
  const rows = Array.isArray(rowsOverride) ? rowsOverride : await loadDonators();
  return buildDonatorsViewModel(rows);
}
