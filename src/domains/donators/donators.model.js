// src/domains/donators/donators.model.js
// Donators — domain model builder

/*
Input: Array<{ date: string, name: string, donation: string|null, value: number }>

Output:
{
  donations: Array<...>,
  totalsByName: Record<string, number>,
  topName: string|null,
  ranked: Array<{ name:string, total:number, tier:string }>,
  recent: Array<{ date:string, name:string, donation:string|null, value:number }>
}
*/

/* ---------------------------------------------------------
   TIERS
--------------------------------------------------------- */

export function resolveDonatorTier(total, isTop) {
  if (isTop) return 'top';
  if (total >= 50_000_000) return 'diamond';
  if (total >= 25_000_000) return 'platinum';
  if (total >= 10_000_000) return 'gold';
  if (total >= 5_000_000) return 'silver';
  if (total >= 1_000_000) return 'bronze';
  return 'none';
}

/* ---------------------------------------------------------
   AGGREGATION
--------------------------------------------------------- */

export function aggregateTotalsByName(donations) {
  const totals = {};
  (donations || []).forEach(d => {
    if (!d || !d.name) return;
    const name = String(d.name).trim();
    const value = Number(d.value) || 0;
    totals[name] = (totals[name] || 0) + value;
  });
  return totals;
}

export function getTopDonatorName(totalsByName) {
  let topName = null;
  let topValue = 0;

  Object.entries(totalsByName || {}).forEach(([name, value]) => {
    const v = Number(value) || 0;
    if (!Number.isFinite(v) || v <= 0) return;

    if (v > topValue) {
      topName = name;
      topValue = v;
      return;
    }

    // Deterministic tie-breaker: alphabetical (case-insensitive)
    if (v === topValue && topName) {
      const a = String(name);
      const b = String(topName);
      if (a.localeCompare(b, undefined, { sensitivity: 'base' }) < 0) {
        topName = name;
      }
    }
  });

  return topName;
}

function safeDateMs(input) {
  const ms = Date.parse(String(input || ''));
  return Number.isFinite(ms) ? ms : 0;
}

export function getRecentDonations(donations, limit = 5) {
  const list = Array.isArray(donations) ? donations : [];
  return [...list]
    .filter(d => d && d.date)
    .sort((a, b) => {
      const byDate = safeDateMs(b.date) - safeDateMs(a.date);
      if (byDate) return byDate;

      const av = Number(a && a.value) || 0;
      const bv = Number(b && b.value) || 0;
      if (bv !== av) return bv - av;

      const an = String(a && a.name || '');
      const bn = String(b && b.name || '');
      return an.localeCompare(bn, undefined, { sensitivity: 'base' });
    })
    .slice(0, limit);
}

export function buildDonatorsModel(donations) {
  const safeDonations = Array.isArray(donations) ? donations : [];

  const totalsByName = aggregateTotalsByName(safeDonations);
  const topName = getTopDonatorName(totalsByName);

  const ranked = Object.entries(totalsByName)
    .map(([name, total]) => ({
      name,
      total: Number(total) || 0,
      tier: resolveDonatorTier(Number(total) || 0, name === topName && (Number(total) || 0) > 0)
    }))
    .sort((a, b) => {
      const byTotal = (Number(b.total) || 0) - (Number(a.total) || 0);
      if (byTotal) return byTotal;
      return String(a.name).localeCompare(String(b.name), undefined, { sensitivity: 'base' });
    });

  const totalDonated = ranked.reduce((sum, d) => sum + (Number(d.total) || 0), 0);

  const tierCounts = ranked.reduce((acc, d) => {
    const key = d && d.tier ? String(d.tier) : 'none';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const recent = getRecentDonations(safeDonations, 5);

  return {
    donations: safeDonations,
    totalsByName,
    topName,
    ranked,
    recent,
    totalDonated,
    tierCounts
  };
}
