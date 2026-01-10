// src/data/member.loader.js
// Member CSV Loader — HARD CONTRACT
// Source of truth: Google Sheets (CSV)

import { loadCSV } from './csv.loader.js';
import { normalizeMemberName } from '../utils/utils.js';

/**
 * Load and normalize member data from CSV.
 *
 * Expected columns:
 * - name
 * - active (TRUE / FALSE checkbox)
 * - sprite (png | gif | jpg | none | empty)
 * - role (optional)
 */
export async function loadMembersFromCSV(csvUrl) {
  const rows = await loadCSV(csvUrl);

  return rows
    .filter(r => r.name)
    .map(r => ({
      name: r.name.trim(),
      key: normalizeMemberName(r.name),
      active: String(r.active).toUpperCase() === 'TRUE',
      sprite: (r.sprite || '').trim().toLowerCase() || null,
      role: (r.role || '').trim()
    }));
}
