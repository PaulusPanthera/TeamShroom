// src/data/members.model.js
//
// MEMBERS MODEL — INTERNAL API
//
// INPUT:
// - members.json (primary)
// - shinyshowcase.json (secondary)
//
// OUTPUT SHAPE:
//
// {
//   name: string,
//   active: boolean,
//   sprite: string | null,
//   role: string,
//   shinies: Array<Shiny>,
//   shinyCount: number,
//   points: number
// }
//
// Guarantees:
// - shinies is always an array
// - shinyCount is derived, never computed at runtime
// - points is derived, never computed at runtime
// - No UI code performs aggregation

export function buildMembersModel(members, shinyShowcase, POKEMON_POINTS = {}) {
  const map = {};

  // Initialize members
  members.forEach(m => {
    const key = m.name.toLowerCase();
    map[key] = {
      name: m.name,
      active: m.active,
      sprite: m.sprite ?? null,
      role: m.role ?? '',
      shinies: [],
      shinyCount: 0,
      points: 0
    };
  });

  // Attach shinies
  shinyShowcase.forEach(s => {
    if (!s.ot) return;

    const key = s.ot.toLowerCase();

    if (!map[key]) {
      map[key] = {
        name: s.ot,
        active: false,
        sprite: null,
        role: '',
        shinies: [],
        shinyCount: 0,
        points: 0
      };
    }

    map[key].shinies.push(s);

    if (!s.lost && !s.sold) {
      map[key].shinyCount += 1;
      map[key].points += s.alpha
        ? 50
        : (POKEMON_POINTS[s.pokemon] ?? 0);
    }
  });

  return Object.values(map);
}
