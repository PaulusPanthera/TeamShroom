// src/data/donators.loader.js
// Donators CSV Loader — HARD CONTRACT
// Source of truth: Google Sheets (CSV)

import { loadCSV } from './csv.loader.js';

/**
 * Load and normalize donator data from CSV.
 *
 * Expected columns:
 * - date
 * - name
 * - donation
 * - value
 */
export async function loadDonatorsFromCSV(csvUrl) {
  const rows = await loadCSV(csvUrl);

  return rows
    .filter(r => r.name)
    .map(r => ({
      date: r.date || '',
      name: r.name.trim(),
      donation: (r.donation || '').trim(),
      value: r.value || '0'
    }));
}
