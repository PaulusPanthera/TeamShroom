// src/domains/shinyweekly/hotw.ai.js
// v2.0.0-beta
// HotW (Hunter of the Week) computation from ShinyWeekly week models.

function safeDateMs(raw) {
  const ms = Date.parse(String(raw || ''));
  return Number.isFinite(ms) ? ms : 0;
}

function normalizeKey(raw) {
  return String(raw || '').trim().toLowerCase();
}

function normalizeName(raw) {
  return String(raw || '').trim();
}

function getPoints(pointsMap, pokemonKey) {
  if (!pointsMap || typeof pointsMap !== 'object') return 0;
  const key = normalizeKey(pokemonKey);
  const v = Object.prototype.hasOwnProperty.call(pointsMap, key) ? pointsMap[key] : 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function isValidWeeklyShiny(shiny) {
  // run/lost mean the shiny was never obtained (event-only flags)
  return !(shiny && (shiny.run || shiny.lost));
}

function compareWeekChronology(a, b) {
  const aScore = safeDateMs(a && (a.dateEnd || a.dateStart));
  const bScore = safeDateMs(b && (b.dateEnd || b.dateStart));
  if (aScore !== bScore) return aScore - bScore;

  const ak = String(a && a.week || '');
  const bk = String(b && b.week || '');
  return ak.localeCompare(bk);
}

export function getLatestWeekKey(weeks) {
  const list = Array.isArray(weeks) ? weeks : [];
  if (!list.length) return '';

  let best = list[0];
  let bestScore = safeDateMs(best && (best.dateEnd || best.dateStart));

  list.forEach(w => {
    const score = safeDateMs(w && (w.dateEnd || w.dateStart));
    if (score > bestScore) {
      best = w;
      bestScore = score;
      return;
    }

    if (score === bestScore) {
      const a = String(w && w.week || '');
      const b = String(best && best.week || '');
      if (a.localeCompare(b) > 0) best = w;
    }
  });

  return String(best && best.week || '').trim();
}

export function computeWeekNumber(weeks, weekKey) {
  const list = Array.isArray(weeks) ? weeks.slice() : [];
  const key = String(weekKey || '').trim();
  if (!list.length || !key) return 0;

  list.sort(compareWeekChronology);
  const idx = list.findIndex(w => String(w && w.week || '').trim() === key);
  if (idx < 0) return 0;
  return idx + 1;
}

function buildMemberStatsFromWeek(week, pointsMap) {
  const byMemberKey = Object.create(null);

  const grouped = week && week.membersByOt ? week.membersByOt : null;
  const values = grouped ? Object.values(grouped) : [];

  values.forEach(m => {
    const memberKey = normalizeKey(m && m.key);
    const memberName = normalizeName(m && m.name);
    if (!memberKey || !memberName) return;

    const shinies = Array.isArray(m && m.shinies) ? m.shinies : [];

    let totalPoints = 0;
    let shinyCount = 0;
    let bestSinglePoints = 0;

    shinies.forEach(s => {
      if (!isValidWeeklyShiny(s)) return;
      const pts = getPoints(pointsMap, s && s.pokemon);
      totalPoints += pts;
      shinyCount += 1;
      if (pts > bestSinglePoints) bestSinglePoints = pts;
    });

    if (!shinyCount) return;

    byMemberKey[memberKey] = {
      memberKey,
      memberName,
      totalPoints,
      shinyCount,
      bestSinglePoints
    };
  });

  return Object.values(byMemberKey);
}

function pickHotwWinners(stats) {
  const list = Array.isArray(stats) ? stats : [];
  if (!list.length) return [];

  let bestPoints = Math.max.apply(null, list.map(s => s.totalPoints));
  let pool = list.filter(s => s.totalPoints === bestPoints);

  if (pool.length > 1) {
    const bestShinies = Math.max.apply(null, pool.map(s => s.shinyCount));
    pool = pool.filter(s => s.shinyCount === bestShinies);
  }

  if (pool.length > 1) {
    const bestSingle = Math.max.apply(null, pool.map(s => s.bestSinglePoints));
    pool = pool.filter(s => s.bestSinglePoints === bestSingle);
  }

  // Stable ordering for multi-winner case
  pool.sort((a, b) => a.memberName.localeCompare(b.memberName));
  return pool;
}

export function computeHotwFromWeeks({ weeks, latestWeekKey, pokemonPointsMap, membersByKey }) {
  const list = Array.isArray(weeks) ? weeks : [];
  const weekKey = String(latestWeekKey || '').trim() || getLatestWeekKey(list);
  if (!weekKey) return null;

  const week = list.find(w => String(w && w.week || '').trim() === weekKey) || null;
  if (!week) return null;

  const weekNumber = computeWeekNumber(list, weekKey);

  const stats = buildMemberStatsFromWeek(week, pokemonPointsMap);
  const winners = pickHotwWinners(stats);
  if (!winners.length) return null;

  const winnerNames = winners.map(w => w.memberName);

  const primary = winners[0];
  const totalPoints = primary.totalPoints;
  const shinyCount = primary.shinyCount;

  const enrichedWinners = winners.map(w => {
    const k = normalizeKey(w.memberKey);
    const m = membersByKey && Object.prototype.hasOwnProperty.call(membersByKey, k) ? membersByKey[k] : null;
    return {
      memberKey: w.memberKey,
      memberName: (m && m.name) ? String(m.name) : w.memberName,
      sprite: m && m.sprite ? String(m.sprite) : '',
      totalPoints: w.totalPoints,
      shinyCount: w.shinyCount,
      bestSinglePoints: w.bestSinglePoints
    };
  });

  return {
    weekKey,
    weekNumber,
    winnerNames,
    winners: enrichedWinners,
    totalPoints,
    shinyCount
  };
}
