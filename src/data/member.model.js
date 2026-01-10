// src/data/member.model.js
// Member Model Builder — HARD CONTRACT
// Pure data shaping. No DOM. No globals.

import { normalizeMemberName } from '../utils/utils.js';

/**
 * Build member models and indexes from loaded CSV rows.
 *
 * INPUT:
 * rows: Array<{
 *   name: string,
 *   key: string,
 *   active: boolean,
 *   sprite: string | null,
 *   role: string
 * }>
 *
 * OUTPUT:
 * {
 *   members: Array<Member>,
 *   memberIndex: Record<memberKey, Member>,
 *   spriteMap: Record<memberKey, spriteExtension>
 * }
 */
export function buildMemberModel(rows) {
  const members = [];
  const memberIndex = {};
  const spriteMap = {};

  rows.forEach(row => {
    const key = row.key || normalizeMemberName(row.name);

    const member = {
      name: row.name,
      key,
      active: !!row.active,
      role: row.role || '',
      sprite: row.sprite || null
    };

    members.push(member);
    memberIndex[key] = member;

    // Sprite registration rules:
    // - sprite === null → no entry
    // - sprite === 'none' → explicit opt-out
    // - sprite === png/gif/jpg → registered
    if (member.sprite && member.sprite !== 'none') {
      spriteMap[key] = member.sprite;
    }
  });

  return {
    members,
    memberIndex,
    spriteMap
  };
}
