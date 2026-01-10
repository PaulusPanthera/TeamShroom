// src/data/shinyshowcase.loader.js
// Shiny Showcase CSV Loader — HARD CONTRACT
// Source of truth: Google Sheets (CSV)

import { loadCSV } from './csv.loader.js';
import {
  normalizeMemberName,
  normalizePokemonName
} from '../utils/utils.js';

/**
 * Load and normalize shiny showcase data from CSV.
 *
 * Expected columns:
 * - member
 * - pokemon
 * - lost (TRUE / FALSE)
 * - sold (TRUE / FALSE)
 * - secret (TRUE / FALSE)
 * - safari (TRUE / FALSE)
 * - egg (TRUE / FALSE)
 * - event (TRUE / FALSE)
 * - alpha (TRUE / FALSE)
 * - clip (optional)
 */
export async function loadShinyShowcaseFromCSV(csvUrl) {
  const rows = await loadCSV(csvUrl);

  return rows
    .filter(r => r.member && r.pokemon)
    .map(r => ({
      member: r.member.trim(),
      memberKey: normalizeMemberName(r.member),
      name: normalizePokemonName(r.pokemon),

      lost: String(r.lost).toUpperCase() === 'TRUE',
      sold: String(r.sold).toUpperCase() === 'TRUE',

      secret: String(r.secret).toUpperCase() === 'TRUE',
      safari: String(r.safari).toUpperCase() === 'TRUE',
      egg: String(r.egg).toUpperCase() === 'TRUE',
      event: String(r.event).toUpperCase() === 'TRUE',
      alpha: String(r.alpha).toUpperCase() === 'TRUE',

      clip: (r.clip || '').trim() || null
    }));
}
