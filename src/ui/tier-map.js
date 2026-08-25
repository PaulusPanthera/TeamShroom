// src/ui/tier-map.js
// Single source of truth for Official Shiny Wars 2026 points -> tier classification.

/**
 * Returns a tier token used for CSS classes.
 * - "lm" (Legendary / Mythical)
 * - "0".."7" (0 highest standard tier, 7 lowest)
 */
export function tierFromPoints(points) {
  const p = Number(points);
  if (!Number.isFinite(p)) return '7';

  // Points come from src/data/pokemondatabuilder.js (TIER_POINTS)
  if (p >= 200) return 'lm';
  if (p >= 50) return '0';
  if (p >= 45) return '1';
  if (p >= 40) return '2';
  if (p >= 30) return '3';
  if (p >= 15) return '4';
  if (p >= 10) return '5';
  if (p >= 5) return '6';
  return '7';
}

/**
 * Coarser grouping used for high-level visual buckets.
 * - "lm" | "hi" (0-1) | "mid" (2-3) | "low" (4-7)
 */
export function tierGroupFromTier(tier) {
  if (tier === 'lm') return 'lm';
  if (tier === '0' || tier === '1') return 'hi';
  if (tier === '2' || tier === '3') return 'mid';
  return 'low';
}
