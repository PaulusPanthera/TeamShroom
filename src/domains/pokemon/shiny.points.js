// src/domains/pokemon/shiny.points.js
// v2.0.0-beta
// Generic shiny value rules aligned with PokeMMO Official Shiny Wars 2026

export const SHINY_POINTS = {
  BASE: {
    LEGENDARY_MYTHICAL: 200,
    ALPHA: 75,
    EGG_MIN: 35
  },
  BONUS: {
    SECRET: 20,
    SAFARI: 10
  }
};

function normalizeKey(raw) {
  return String(raw || '').trim().toLowerCase();
}

function normalizeMethod(raw) {
  const s = String(raw ?? '').trim().toLowerCase();
  return s ? s : null;
}

export function getTierPoints(pointsMap, pokemonKey) {
  const key = normalizeKey(pokemonKey);
  if (!key) return 0;

  const map = pointsMap && typeof pointsMap === 'object' ? pointsMap : {};
  const v = Object.prototype.hasOwnProperty.call(map, key) ? map[key] : 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function isSafariEntry(entry) {
  // Weekly model exposes `safari` boolean; Showcase uses method strings.
  if (entry && entry.safari === true) return true;

  const m = normalizeMethod(entry && entry.method);
  if (!m) return false;

  // Be permissive: some legacy sheets store "safari ..." etc.
  return m === 'safari' || m.includes('safari');
}

export function isEggEntry(entry) {
  const m = normalizeMethod(entry && entry.method);
  return m === 'egg';
}

/**
 * Compute the current generic shiny value for a single shiny entry.
 *
 * Base points:
 * - Legendary/Mythical (tier lm): 200
 * - Alpha: 75
 * - Egg: max(35, tier points)
 * - Else: tier points
 *
 * Bonus points:
 * - Secret: +20
 * - Safari: +10
 *
 * The Official 2026 team-first evolution-line bonus (+8) is event-state dependent
 * and is intentionally not applied to generic Showcase / Weekly / Pokédex totals.
 */
export function computeShinyPoints(entry, pointsMap) {
  const tierPoints = getTierPoints(pointsMap, entry && entry.pokemon);

  const isLegendaryMythical = tierPoints >= SHINY_POINTS.BASE.LEGENDARY_MYTHICAL;
  const alpha = Boolean(entry && entry.alpha);
  const secret = Boolean(entry && entry.secret);
  const safari = isSafariEntry(entry);
  const egg = isEggEntry(entry);

  let basePoints = tierPoints;

  if (isLegendaryMythical) {
    basePoints = SHINY_POINTS.BASE.LEGENDARY_MYTHICAL;
  } else if (alpha) {
    basePoints = SHINY_POINTS.BASE.ALPHA;
  } else if (egg) {
    basePoints = Math.max(SHINY_POINTS.BASE.EGG_MIN, tierPoints);
  } else {
    basePoints = tierPoints;
  }

  let bonusPoints = 0;
  if (secret) bonusPoints += SHINY_POINTS.BONUS.SECRET;
  if (safari) bonusPoints += SHINY_POINTS.BONUS.SAFARI;

  const totalPoints = basePoints + bonusPoints;

  return {
    tierPoints,
    basePoints,
    bonusPoints,
    totalPoints,
    flags: {
      legendaryMythical: isLegendaryMythical,
      alpha,
      secret,
      safari,
      egg
    }
  };
}

/**
 * Hitlist-safe deltas:
 * Hitlist base is always "tier points" (claimed once), so special variants
 * award only the *extra above tier*, plus the normal secret/safari bonuses.
 */
export function computeHitlistVariantDeltas(entry, tierPoints) {
  const tier = Number(tierPoints);
  const safeTier = Number.isFinite(tier) ? tier : 0;

  const alpha = Boolean(entry && entry.alpha);
  const secret = Boolean(entry && entry.secret);
  const safari = isSafariEntry(entry);

  const alphaDelta = alpha ? Math.max(0, SHINY_POINTS.BASE.ALPHA - safeTier) : 0;

  // NOTE: Hitlist currently ignores Egg ownership/points (UI doesn't expose it).
  const eggDelta = 0;

  const secretBonus = secret ? SHINY_POINTS.BONUS.SECRET : 0;
  const safariBonus = safari ? SHINY_POINTS.BONUS.SAFARI : 0;

  return {
    alphaDelta,
    eggDelta,
    secretBonus,
    safariBonus,
    totalDelta: alphaDelta + eggDelta + secretBonus + safariBonus,
    flags: { alpha, egg: false, secret, safari }
  };
}

