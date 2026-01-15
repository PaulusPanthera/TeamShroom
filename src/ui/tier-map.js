// src/ui/tier-map.js
// Single source of truth for points -> tier classification.

/**
 * Returns a tier token used for CSS classes.
 * - "lm" (Legendary Mystic)
 * - "0".."6" (0 best, 6 worst)
 */
export function tierFromPoints(points) {
  const p = Number(points);
  if (!Number.isFinite(p)) return '6';

  // Points come from src/data/pokemondatabuilder.js (TIER_POINTS)
  // tier lm: 100
  // tier 0: 30
  // tier 1: 25
  // tier 2: 15
  // tier 3: 10
  // tier 4: 6
  // tier 5: 3
  // tier 6: 2
  if (p >= 100) return 'lm';
  if (p >= 30) return '0';
  if (p >= 25) return '1';
  if (p >= 15) return '2';
  if (p >= 10) return '3';
  if (p >= 6) return '4';
  if (p >= 3) return '5';
  return '6';
}

/**
 * Coarser grouping used for high-level visual buckets.
 * - "lm" | "hi" (0-1) | "mid" (2-3) | "low" (4-6)
 */
export function tierGroupFromTier(tier) {
  if (tier === 'lm') return 'lm';
  if (tier === '0' || tier === '1') return 'hi';
  if (tier === '2' || tier === '3') return 'mid';
  return 'low';
}
