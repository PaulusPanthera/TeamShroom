// membersprite.js
// Member Sprite Resolver — HARD CONTRACT
// Pure, synchronous, data-driven

import { normalizeMemberName } from './utils.js';

/**
 * Resolve a member sprite URL.
 *
 * Contract:
 * - Always returns a STRING
 * - Never probes the filesystem
 * - Never throws
 * - Never returns Promise
 *
 * Data source of truth:
 * - teamShowcase / members data (from Google Sheets)
 *
 * Expected member entry shape:
 * {
 *   name: "Paulus",
 *   sprite: "png" | "gif" | "jpg" | "none" | ""
 * }
 */
export function getMemberSprite(memberName, membersData = []) {
  const base = normalizeMemberName(memberName);

  const entry = membersData.find(
    m => normalizeMemberName(m.name) === base
  );

  // Explicit opt-out or missing entry
  if (!entry || entry.sprite === 'none' || !entry.sprite) {
    return 'img/membersprites/examplesprite.png';
  }

  // Explicit, trusted format
  return `img/membersprites/${base}sprite.${entry.sprite}`;
}
