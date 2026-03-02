// src/domains/pokemon/shiny.points.js
// v2.0.0-beta
// Shiny points rules (PokeMMO Shiny Wars 2025 style) — base + bonus

export const SHINYWARS = {
  BASE: {
    LEGENDARY_MYTHICAL: 100,
    ALPHA: 50,
    EGG_MIN: 20
  },
  BONUS: {
    SECRET: 10,
    SAFARI: 5
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
 * Compute Shiny Wars-style points for a single shiny entry.
 *
 * Base points:
 * - Legendary/Mythical (tier lm): 100
 * - Alpha: 50
 * - Egg: max(20, tier points)
 * - Else: tier points
 *
 * Bonus points:
 * - Secret: +10
 * - Safari: +5
 */
export function computeShinyWarsPoints(entry, pointsMap) {
  const tierPoints = getTierPoints(pointsMap, entry && entry.pokemon);

  const isLegendaryMythical = tierPoints >= SHINYWARS.BASE.LEGENDARY_MYTHICAL;
  const alpha = Boolean(entry && entry.alpha);
  const secret = Boolean(entry && entry.secret);
  const safari = isSafariEntry(entry);
  const egg = isEggEntry(entry);

  let basePoints = tierPoints;

  if (isLegendaryMythical) {
    basePoints = SHINYWARS.BASE.LEGENDARY_MYTHICAL;
  } else if (alpha) {
    basePoints = SHINYWARS.BASE.ALPHA;
  } else if (egg) {
    basePoints = Math.max(SHINYWARS.BASE.EGG_MIN, tierPoints);
  } else {
    basePoints = tierPoints;
  }

  let bonusPoints = 0;
  if (secret) bonusPoints += SHINYWARS.BONUS.SECRET;
  if (safari) bonusPoints += SHINYWARS.BONUS.SAFARI;

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

  const alphaDelta = alpha ? Math.max(0, SHINYWARS.BASE.ALPHA - safeTier) : 0;

  // NOTE: Hitlist currently ignores Egg ownership/points (UI doesn't expose it).
  const eggDelta = 0;

  const secretBonus = secret ? SHINYWARS.BONUS.SECRET : 0;
  const safariBonus = safari ? SHINYWARS.BONUS.SAFARI : 0;

  return {
    alphaDelta,
    eggDelta,
    secretBonus,
    safariBonus,
    totalDelta: alphaDelta + eggDelta + secretBonus + safariBonus,
    flags: { alpha, egg: false, secret, safari }
  };
}

