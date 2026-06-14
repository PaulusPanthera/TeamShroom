// src/domains/shinyweekly/shinyweekly.model.js
// v2.0.0-beta
// ShinyWeekly model normalization (pure data shaping, no DOM)

/*
INTERNAL JSON API — SHINY WEEKLY MODEL OUTPUT

Array<{
  week: string
  label: string
  dateStart: string | null
  dateEnd: string | null
  dateCatch?: string | null
  shinyCount: number
  hunterCount: number

  // Event stream, stable order (week_order when available; source row order fallback).
  // NOTE: This is intentionally NOT grouped by member.
  // Downstream claim resolution (ShinyDex) consumes this structure in-order.
  members: Array<{
    key: string
    name: string
    shinies: Array<{
      member: string
      pokemon: string
      dateCatch?: string | null
      weekOrder: string | null
      method: string | null
      encounter: number | null
      secret: boolean
      alpha: boolean
      safari: boolean
      run: boolean
      lost: boolean
      clip: string | null
      notes: string | null
    }>
  }>

  // Grouped view for Weekly UI. Not used by ShinyDex.
  membersByOt: {
    [memberKey: string]: {
      key: string
      name: string
      shinies: Array<{
        member: string
        pokemon: string
        dateCatch?: string | null
        method: string | null
        encounter: number | null
        secret: boolean
        alpha: boolean
        safari: boolean
        run: boolean
        lost: boolean
        clip: string | null
        notes: string | null
      }>
    }
  }
}>
*/

function toTrimmedString(raw) {
  const s = String(raw ?? '').trim();
  return s;
}

function toNullableString(raw) {
  const s = toTrimmedString(raw);
  return s ? s : null;
}

function parseBoolean(raw) {
  if (raw === true) return true;
  if (raw === false) return false;
  if (raw == null) return false;

  if (typeof raw === 'number') return raw !== 0;

  if (typeof raw === 'string') {
    const s = raw.trim().toLowerCase();
    if (!s) return false;
    return s === 'true' || s === '1' || s === 'yes' || s === 'y' || s === 't';
  }

  return false;
}

function normalizePokemonKey(raw) {
  const s = toTrimmedString(raw);
  return s ? s.toLowerCase() : '';
}

function normalizeMemberName(raw) {
  return toTrimmedString(raw);
}

function normalizeMemberKeyFromName(name) {
  return String(name || '').trim().toLowerCase();
}

function normalizeMethod(raw) {
  const s = toNullableString(raw);
  if (!s) return null;
  return s.toLowerCase();
}

function normalizeEncounter(raw) {
  if (raw == null) return null;
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;

  const s = toTrimmedString(raw);
  if (!s) return null;

  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return n;
}

function normalizeWeekOrder(raw) {
  if (raw == null) return null;

  const s = toTrimmedString(raw);
  if (!s) return null;
  if (!/^\d+$/.test(s)) return null;

  const n = Number(s);
  if (!Number.isInteger(n) || n <= 0) return null;

  return String(n).padStart(3, '0');
}

function weekOrderSortValue(weekOrder) {
  if (!weekOrder) return Number.POSITIVE_INFINITY;

  const n = Number(weekOrder);
  return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY;
}

function compareNormalizedRows(a, b) {
  const ad = String(a && a.date_start ? a.date_start : '');
  const bd = String(b && b.date_start ? b.date_start : '');
  if (ad !== bd) return ad.localeCompare(bd);

  const ae = String(a && a.date_end ? a.date_end : '');
  const be = String(b && b.date_end ? b.date_end : '');
  if (ae !== be) return ae.localeCompare(be);

  const aw = String(a && a.week ? a.week : '');
  const bw = String(b && b.week ? b.week : '');
  if (aw !== bw) return aw.localeCompare(bw);

  const ao = weekOrderSortValue(a && a.weekOrder);
  const bo = weekOrderSortValue(b && b.weekOrder);
  if (ao !== bo) return ao - bo;

  return (a && a.sourceIndex ? a.sourceIndex : 0) - (b && b.sourceIndex ? b.sourceIndex : 0);
}

function hasExplicitField(row, key) {
  if (!row) return false;
  if (!Object.prototype.hasOwnProperty.call(row, key)) return false;
  const v = row[key];
  if (v == null) return false;
  if (typeof v === 'string' && v.trim() === '') return false;
  return true;
}

function normalizeWeeklyRow(row) {
  const week = toTrimmedString(row && row.week);
  const weekLabel = toTrimmedString(row && row.week_label);

  const memberName = normalizeMemberName(row && row.ot);
  const memberKey = normalizeMemberKeyFromName(memberName);

  const pokemon = normalizePokemonKey(row && row.pokemon);
  const method = normalizeMethod(row && row.method);

  const secret = parseBoolean(row && row.secret);
  const alpha = parseBoolean(row && row.alpha);
  const run = parseBoolean(row && row.run);
  const lost = parseBoolean(row && row.lost);

  // Safari support:
  // - If a sheet boolean column exists, it is authoritative.
  // - Otherwise, derive from method === 'safari' for legacy sheets.
  const safari = hasExplicitField(row, 'safari')
    ? parseBoolean(row && row.safari)
    : method === 'safari';

  return {
    week,
    label: weekLabel || week,

    date_start: toNullableString(row && row.date_start),
    date_end: toNullableString(row && row.date_end),
    date_catch: toNullableString(row && row.date_catch),
    weekOrder: normalizeWeekOrder(row && row.week_order),

    memberName,
    memberKey,
    pokemon,
    method,
    encounter: normalizeEncounter(row && row.encounter),

    secret,
    alpha,
    safari,
    run,
    lost,

    clip: toNullableString(row && row.clip),
    notes: toNullableString(row && row.notes),
    location: toNullableString(row && row.location)
  };
}

export function buildShinyWeeklyModel(rows) {
  const list = Array.isArray(rows) ? rows : [];

  const weeksByKey = Object.create(null);
  const weekKeys = [];

  const normalizedRows = list
    .map((rawRow, sourceIndex) => ({
      ...normalizeWeeklyRow(rawRow),
      sourceIndex
    }))
    .filter(r => r.week && r.memberName && r.pokemon)
    .sort(compareNormalizedRows);

  normalizedRows.forEach(r => {
    if (!weeksByKey[r.week]) {
      weeksByKey[r.week] = {
        week: r.week,
        label: r.label || r.week,
        dateStart: r.date_start,
        dateEnd: r.date_end,
        shinyCount: 0,

        // in-order event stream (single-event groups)
        members: [],

        // grouped representation for Weekly UI
        membersByOt: Object.create(null)
      };

      weekKeys.push(r.week);
    }

    const week = weeksByKey[r.week];

    // Stabilize week dates on first seen row.
    // CI guarantees date_start/date_end are present for all rows, but keep this defensive.
    if (!week.dateStart && r.date_start) week.dateStart = r.date_start;
    if (!week.dateEnd && r.date_end) week.dateEnd = r.date_end;

    const shiny = {
      member: r.memberName,
      pokemon: r.pokemon,
      dateCatch: r.date_catch,
      weekOrder: r.weekOrder,
      method: r.method,
      encounter: r.encounter,
      secret: r.secret,
      alpha: r.alpha,
      safari: r.safari,
      run: r.run,
      lost: r.lost,
      clip: r.clip,
      notes: r.notes,
      location: r.location
    };

    // Preserve raw row order for downstream claim logic
    week.members.push({
      key: r.memberKey,
      name: r.memberName,
      shinies: [shiny]
    });

    // Also preserve grouped view for Weekly UI
    if (!week.membersByOt[r.memberKey]) {
      week.membersByOt[r.memberKey] = {
        key: r.memberKey,
        name: r.memberName,
        shinies: []
      };
    }

    week.membersByOt[r.memberKey].shinies.push(shiny);
    if (!(shiny.run || shiny.lost)) week.shinyCount += 1;
  });

  return weekKeys.map(weekKey => {
    const week = weeksByKey[weekKey];
    const hunterCount = Object.values(week.membersByOt).filter(function(m){
      var list = m && Array.isArray(m.shinies) ? m.shinies : [];
      return list.some(function(s){ return !(s && (s.run || s.lost)); });
    }).length;
    return {
      week: week.week,
      label: week.label,
      dateStart: week.dateStart || null,
      dateEnd: week.dateEnd || null,
      shinyCount: week.shinyCount,
      hunterCount,
      members: week.members,
      membersByOt: week.membersByOt
    };
  });
}
