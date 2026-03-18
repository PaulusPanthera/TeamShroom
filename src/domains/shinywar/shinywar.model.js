// src/domains/shinywar/shinywar.model.js
// v2.0.0-beta
// Shiny War board derivation from Weekly rows + war config.

import { computeShinyWarsPoints } from '../pokemon/shiny.points.js';
import { getPokemonFamiliesMap } from '../pokemon/pokemon.data.js';

const DAY7_POOL = new Set([
  'zigzagoon',
  'poochyena',
  'shroomish',
  'wurmple',
  'cascoon',
  'silcoon',
  'slakoth',
  'taillow',
  'treecko'
]);

const STARTER_ROOTS = new Set([
  'bulbasaur', 'charmander', 'squirtle',
  'chikorita', 'cyndaquil', 'totodile',
  'treecko', 'torchic', 'mudkip',
  'turtwig', 'chimchar', 'piplup',
  'snivy', 'tepig', 'oshawott'
]);

function norm(raw) {
  return String(raw || '').trim().toLowerCase();
}

function pretty(raw) {
  return String(raw || '').trim();
}

function toIsoDate(value) {
  const s = String(value || '').trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}

function dateMs(iso) {
  const safe = toIsoDate(iso);
  if (!safe) return null;
  const ms = Date.parse(`${safe}T00:00:00Z`);
  return Number.isFinite(ms) ? ms : null;
}

function diffDays(aIso, bIso) {
  const a = dateMs(aIso);
  const b = dateMs(bIso);
  if (a == null || b == null) return null;
  return Math.round((b - a) / 86400000);
}

function overlapsWindow(weekStart, weekEnd, eventStart, eventEnd) {
  const a = dateMs(weekStart);
  const b = dateMs(weekEnd);
  const c = dateMs(eventStart);
  const d = dateMs(eventEnd);
  if (a == null || b == null || c == null || d == null) return false;
  return a <= d && b >= c;
}

function methodLabel(method) {
  const m = norm(method);
  if (!m) return 'Unknown';
  if (m === 'mpb') return 'MPB';
  return m.charAt(0).toUpperCase() + m.slice(1).replace(/_/g, ' ');
}

function wildCaughtByMethod(method) {
  const m = norm(method);
  return !(m === 'egg' || m === 'fossil' || m === 'mpb' || m === 'mysterious_ball' || m === 'mysteriousball');
}

function isStarterFamily(pokemonKey) {
  const key = norm(pokemonKey);
  if (!key) return false;
  const families = getPokemonFamiliesMap() || {};
  const roots = Array.isArray(families[key]) ? families[key] : [];
  if (roots.length) {
    return STARTER_ROOTS.has(norm(roots[0]));
  }
  return STARTER_ROOTS.has(key);
}

function buildTeamLookup(config) {
  const out = Object.create(null);
  const teams = Array.isArray(config && config.teams) ? config.teams : [];

  teams.forEach((team, teamIndex) => {
    const teamName = pretty(team && team.name);
    const leader = pretty(team && team.leader);
    const rawMembers = [];
    if (leader) rawMembers.push(leader);
    if (Array.isArray(team && team.members)) rawMembers.push(...team.members);

    rawMembers.forEach((name) => {
      const key = norm(name);
      if (!key) return;
      out[key] = {
        teamName,
        leader,
        teamIndex,
      };
    });
  });

  return out;
}

function flattenWeekly(weeklyModel) {
  const weeks = Array.isArray(weeklyModel) ? weeklyModel : [];
  const out = [];

  weeks.forEach((week) => {
    const members = Array.isArray(week && week.members) ? week.members : [];
    members.forEach((group) => {
      const shinies = Array.isArray(group && group.shinies) ? group.shinies : [];
      shinies.forEach((shiny, index) => {
        out.push({
          week: week && week.week ? week.week : '',
          weekLabel: week && week.label ? week.label : '',
          dateStart: week && week.dateStart ? week.dateStart : null,
          dateEnd: week && week.dateEnd ? week.dateEnd : null,
          memberKey: norm(group && group.key),
          memberName: pretty(shiny && shiny.member),
          pokemon: norm(shiny && shiny.pokemon),
          dateCatch: toIsoDate(shiny && shiny.dateCatch),
          method: shiny && shiny.method ? String(shiny.method) : null,
          encounter: shiny && shiny.encounter != null ? shiny.encounter : null,
          secret: Boolean(shiny && shiny.secret),
          alpha: Boolean(shiny && shiny.alpha),
          safari: Boolean(shiny && shiny.safari),
          run: Boolean(shiny && shiny.run),
          lost: Boolean(shiny && shiny.lost),
          clip: shiny && shiny.clip ? String(shiny.clip) : null,
          notes: shiny && shiny.notes ? String(shiny.notes) : null,
          location: shiny && shiny.location ? String(shiny.location) : null,
          orderIndex: index,
        });
      });
    });
  });

  return out;
}

function computeEventDay(config, entryDate) {
  const start = toIsoDate(config && config.startDate);
  const end = toIsoDate(config && config.endDate);
  const graceDays = Math.max(0, Number(config && config.timezoneGraceDays) || 0);
  const date = toIsoDate(entryDate);
  if (!start || !end || !date) return { included: false, dayNumber: null, spill: null, officialDate: null };

  const startMs = dateMs(start);
  const endMs = dateMs(end);
  const dateValue = dateMs(date);
  const graceMs = graceDays * 86400000;

  if (dateValue == null || startMs == null || endMs == null) {
    return { included: false, dayNumber: null, spill: null, officialDate: null };
  }

  if (dateValue < startMs - graceMs || dateValue > endMs + graceMs) {
    return { included: false, dayNumber: null, spill: null, officialDate: null };
  }

  if (dateValue < startMs) {
    return { included: true, dayNumber: 1, spill: 'pre', officialDate: start };
  }

  if (dateValue > endMs) {
    return { included: true, dayNumber: diffDays(start, end) + 1, spill: 'post', officialDate: end };
  }

  return {
    included: true,
    dayNumber: diffDays(start, date) + 1,
    spill: null,
    officialDate: date,
  };
}

function dailyBonusForEntry(entry, ctx) {
  const day = Number(entry.dayNumber) || 0;
  const method = norm(entry.method);
  const pokemon = norm(entry.pokemon);
  const daily = { points: 0, label: null };

  if (entry.run || entry.lost) return daily;

  if (day === 1) {
    if (method === 'single') {
      if (ctx.dexUnclaimed) {
        daily.points = 37;
        daily.label = 'Day 1 Dex Single';
      } else {
        daily.points = 12;
        daily.label = 'Day 1 Other Single';
      }
    }
    return daily;
  }

  if (day === 2) {
    if (method === 'horde' && ctx.dexUnclaimed) {
      daily.points = 10;
      daily.label = 'Day 2 Dex Horde';
    }
    return daily;
  }

  if (day === 3) {
    return daily;
  }

  if (day === 4) {
    if (entry.safari || method === 'safari') {
      daily.points = 20;
      daily.label = 'Day 4 Safari';
    }
    return daily;
  }

  if (day === 5) {
    if (method === 'single') {
      if (isStarterFamily(pokemon) && wildCaughtByMethod(method)) {
        daily.points = 47;
        daily.label = 'Day 5 Starter';
      } else {
        daily.points = 12;
        daily.label = 'Day 5 Other Single';
      }
    }
    return daily;
  }

  if (day === 6) {
    if (method === 'fishing' && ctx.dexUnclaimed) {
      daily.points = 15;
      daily.label = 'Day 6 Fishing';
    }
    return daily;
  }

  if (day === 7) {
    if (pokemon === 'shroomish') {
      daily.points = 32;
      daily.label = 'Day 7 Shroomish';
    } else if (pokemon === 'parasect' || pokemon === 'amoonguss') {
      daily.points = 3;
      daily.label = 'Day 7 Mushroom Species';
    } else if (method === 'single' && DAY7_POOL.has(pokemon)) {
      daily.points = 12;
      daily.label = 'Day 7 Forest Single';
    }
    return daily;
  }

  return daily;
}

function buildRules(config) {
  const rules = Array.isArray(config && config.rules) ? config.rules : [];
  return rules.map((rule) => ({
    day: Number(rule && rule.day) || null,
    title: pretty(rule && rule.title),
    description: pretty(rule && rule.description),
  }));
}

export function buildShinyWarModel({ weeklyModel, config, pointsMap }) {
  const safeConfig = config && typeof config === 'object' ? config : {};
  const teams = Array.isArray(safeConfig.teams) ? safeConfig.teams : [];
  const teamLookup = buildTeamLookup(safeConfig);
  const points = pointsMap && typeof pointsMap === 'object' ? pointsMap : {};
  const stream = flattenWeekly(weeklyModel);
  const claimedSpecies = new Set();
  const teamSpeciesSeen = Object.create(null);
  const entries = [];

  stream.forEach((row) => {
    const memberKey = norm(row.memberName || row.memberKey);
    const teamSlot = teamLookup[memberKey] || null;
    const success = !(row.run || row.lost);
    const dexUnclaimed = !claimedSpecies.has(row.pokemon);

    const hasCatchDate = Boolean(row.dateCatch);
    const dayInfo = hasCatchDate ? computeEventDay(safeConfig, row.dateCatch) : { included: false, dayNumber: null, spill: null, officialDate: null };
    const weekOverlap = overlapsWindow(row.dateStart, row.dateEnd, safeConfig.startDate, safeConfig.endDate);

    const shouldShowPending = Boolean(teamSlot) && !hasCatchDate && weekOverlap;
    const shouldInclude = Boolean(teamSlot) && (dayInfo.included || shouldShowPending);

    if (shouldInclude) {
      const score = success ? computeShinyWarsPoints(row, points) : {
        tierPoints: 0,
        basePoints: 0,
        bonusPoints: 0,
        totalPoints: 0,
        flags: { secret: false, safari: false, alpha: false, egg: false, legendaryMythical: false }
      };

      if (!teamSpeciesSeen[teamSlot.teamName]) teamSpeciesSeen[teamSlot.teamName] = new Set();
      const speciesSet = teamSpeciesSeen[teamSlot.teamName];
      const speciesBonus = (success && dayInfo.included && !speciesSet.has(row.pokemon)) ? 5 : 0;
      if (success && dayInfo.included && speciesBonus > 0) speciesSet.add(row.pokemon);

      const daily = success && dayInfo.included
        ? dailyBonusForEntry({ ...row, dayNumber: dayInfo.dayNumber }, { dexUnclaimed })
        : { points: 0, label: null };

      const totalPoints = success && dayInfo.included
        ? score.totalPoints + daily.points + speciesBonus
        : 0;

      const breakdown = [];
      if (row.run || row.lost) breakdown.push(row.run ? 'run fail' : 'lost fail');
      if (success && score.basePoints) breakdown.push(`${score.basePoints} base`);
      if (success && score.flags.secret) breakdown.push('+10 secret');
      if (success && score.flags.safari) breakdown.push('+5 safari variant');
      if (success && score.flags.alpha && score.basePoints === 50) breakdown.push('alpha base');
      if (success && daily.points) breakdown.push(`+${daily.points} daily`);
      if (success && speciesBonus) breakdown.push('+5 species');
      if (dexUnclaimed && success) breakdown.push('dex-open');
      if (dayInfo.spill === 'pre') breakdown.push('timezone spill pre-start');
      if (dayInfo.spill === 'post') breakdown.push('timezone spill post-end');
      if (shouldShowPending) breakdown.push('waiting for catch date');

      entries.push({
        id: `${row.week}:${row.memberName}:${row.pokemon}:${entries.length + 1}`,
        team: teamSlot.teamName,
        leader: teamSlot.leader,
        teamIndex: teamSlot.teamIndex,
        member: row.memberName,
        memberKey,
        pokemon: row.pokemon,
        dateCatch: row.dateCatch,
        week: row.week,
        weekLabel: row.weekLabel,
        method: row.method,
        encounter: row.encounter,
        secret: row.secret,
        alpha: row.alpha,
        safari: row.safari,
        run: row.run,
        lost: row.lost,
        failed: row.run || row.lost,
        pendingDate: shouldShowPending,
        includedByGrace: dayInfo.spill != null,
        dayNumber: dayInfo.dayNumber,
        officialDate: dayInfo.officialDate,
        dexUnclaimed,
        basePoints: score.basePoints,
        variantPoints: score.bonusPoints,
        dailyPoints: daily.points,
        dailyLabel: daily.label,
        speciesBonus,
        totalPoints,
        breakdown,
        notes: row.notes,
        location: row.location,
        clip: row.clip,
      });
    }

    if (success && row.pokemon) {
      claimedSpecies.add(row.pokemon);
    }
  });

  const byTeam = teams.map((team, index) => {
    const name = pretty(team && team.name);
    const teamEntries = entries.filter((entry) => entry.team === name);
    const scored = teamEntries.filter((entry) => !entry.failed && !entry.pendingDate && entry.dayNumber != null);
    const fails = teamEntries.filter((entry) => entry.failed);
    const pending = teamEntries.filter((entry) => entry.pendingDate);
    const pointsTotal = scored.reduce((sum, entry) => sum + (Number(entry.totalPoints) || 0), 0);
    const shinyCount = scored.length;
    const speciesCount = scored.filter((entry) => entry.speciesBonus > 0).length;

    const byMember = Object.create(null);
    scored.forEach((entry) => {
      if (!byMember[entry.member]) byMember[entry.member] = { member: entry.member, points: 0, shinies: 0 };
      byMember[entry.member].points += Number(entry.totalPoints) || 0;
      byMember[entry.member].shinies += 1;
    });

    const mvp = Object.values(byMember)
      .sort((a, b) => (b.points - a.points) || (b.shinies - a.shinies) || a.member.localeCompare(b.member))[0] || null;

    return {
      rank: index + 1,
      name,
      leader: pretty(team && team.leader),
      points: pointsTotal,
      shinies: shinyCount,
      species: speciesCount,
      fails: fails.length,
      pending: pending.length,
      rosterSlots: 1 + (Array.isArray(team && team.members) ? team.members.length : 0),
      entries: teamEntries,
      mvp,
    };
  }).sort((a, b) => (b.points - a.points) || (b.shinies - a.shinies) || a.name.localeCompare(b.name));

  byTeam.forEach((team, index) => { team.rank = index + 1; });

  const scoredEntries = entries.filter((entry) => !entry.failed && !entry.pendingDate && entry.dayNumber != null);
  const failEntries = entries.filter((entry) => entry.failed);
  const pendingEntries = entries.filter((entry) => entry.pendingDate);

  const mvp = Object.values(scoredEntries.reduce((acc, entry) => {
    if (!acc[entry.member]) {
      acc[entry.member] = { member: entry.member, team: entry.team, points: 0, shinies: 0 };
    }
    acc[entry.member].points += Number(entry.totalPoints) || 0;
    acc[entry.member].shinies += 1;
    return acc;
  }, Object.create(null))).sort((a, b) => (b.points - a.points) || (b.shinies - a.shinies) || a.member.localeCompare(b.member))
    .map((row, index) => ({ rank: index + 1, ...row }));

  const latestDay = entries.reduce((best, entry) => Math.max(best, Number(entry.dayNumber) || 0), 0);
  const totalPoints = byTeam.reduce((sum, team) => sum + (Number(team.points) || 0), 0);

  return {
    title: pretty(safeConfig.title) || 'Shiny War',
    startDate: toIsoDate(safeConfig.startDate),
    endDate: toIsoDate(safeConfig.endDate),
    timezoneGraceDays: Math.max(0, Number(safeConfig.timezoneGraceDays) || 0),
    speciesBonusPoints: Math.max(0, Number(safeConfig.speciesBonusPoints) || 5),
    currentDay: latestDay || null,
    rules: buildRules(safeConfig),
    teams: byTeam,
    entries,
    scoredEntries,
    failEntries,
    pendingEntries,
    mvp,
    totalPoints,
    summary: {
      trackedEntries: entries.length,
      scoredEntries: scoredEntries.length,
      failEntries: failEntries.length,
      pendingEntries: pendingEntries.length,
      teamCount: byTeam.length,
      totalPoints,
    },
    helpers: {
      methodLabel,
    }
  };
}
