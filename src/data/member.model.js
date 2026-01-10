// src/data/member.model.js
// Member Model Builder — HARD CONTRACT
// Combines members + shiny showcase into final teamShowcase structure

import { normalizeMemberName } from '../utils/utils.js';

/**
 * Build team showcase model.
 *
 * Output shape:
 * [
 *   {
 *     name,
 *     key,
 *     active,
 *     sprite,
 *     role,
 *     shinies: [ ... ]
 *   }
 * ]
 */
export function buildMemberModel(members, shinyShowcase) {
  const map = {};

  // Initialize members
  members.forEach(m => {
    map[m.key] = {
      name: m.name,
      key: m.key,
      active: m.active,
      sprite: m.sprite,
      role: m.role,
      shinies: []
    };
  });

  // Attach shinies
  shinyShowcase.forEach(s => {
    const key = s.memberKey;

    // Allow ex-members to still appear
    if (!map[key]) {
      map[key] = {
        name: s.member,
        key,
        active: false,
        sprite: null,
        role: '',
        shinies: []
      };
    }

    map[key].shinies.push({
      name: s.name,
      lost: s.lost,
      sold: s.sold,
      secret: s.secret,
      safari: s.safari,
      egg: s.egg,
      event: s.event,
      alpha: s.alpha,
      clip: s.clip
    });
  });

  return Object.values(map);
}
