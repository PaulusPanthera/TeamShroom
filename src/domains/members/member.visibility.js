// src/domains/members/member.visibility.js
// v2.0.0-beta
// Shared member visibility rules for showcase-derived surfaces

function normalizeKey(value) {
  return String(value || '').trim().toLowerCase();
}

export function buildActiveMemberKeySet(membersRows) {
  const rows = Array.isArray(membersRows) ? membersRows : [];
  const keys = new Set();

  rows.forEach((row) => {
    if (!row || row.active !== true) return;
    const key = normalizeKey(row.name);
    if (!key) return;
    keys.add(key);
  });

  return keys;
}

export function filterShowcaseRowsToActiveMembers(showcaseRows, membersRows) {
  const rows = Array.isArray(showcaseRows) ? showcaseRows : [];
  const activeKeys = buildActiveMemberKeySet(membersRows);
  if (!activeKeys.size) return [];

  return rows.filter((row) => {
    const key = normalizeKey(row && row.ot);
    return key ? activeKeys.has(key) : false;
  });
}

export function filterShowcaseMembersToActive(members) {
  const rows = Array.isArray(members) ? members : [];
  return rows.filter((member) => Boolean(member && member.active === true));
}
