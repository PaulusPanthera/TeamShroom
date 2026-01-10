// src/data/shinyshowcase.model.js
// Shiny Showcase Model Builder — HARD CONTRACT
// Groups shinies per member for Showcase & Member views

/**
 * Build showcase model from flat shiny rows.
 *
 * Output shape:
 * [
 *   {
 *     name: 'MemberName',
 *     key: 'membername',
 *     shinies: [
 *       {
 *         name,
 *         lost,
 *         sold,
 *         secret,
 *         safari,
 *         egg,
 *         event,
 *         alpha,
 *         clip
 *       }
 *     ]
 *   }
 * ]
 */
export function buildShinyShowcaseModel(rows) {
  const byMember = {};

  rows.forEach(r => {
    if (!byMember[r.memberKey]) {
      byMember[r.memberKey] = {
        name: r.member,
        key: r.memberKey,
        shinies: []
      };
    }

    byMember[r.memberKey].shinies.push({
      name: r.name,
      lost: r.lost,
      sold: r.sold,
      secret: r.secret,
      safari: r.safari,
      egg: r.egg,
      event: r.event,
      alpha: r.alpha,
      clip: r.clip
    });
  });

  return Object.values(byMember);
}
