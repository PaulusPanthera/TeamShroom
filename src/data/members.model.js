// src/data/members.model.js
// Members model builder
// CI-normalized input → runtime-stable member model

/*
INTERNAL JSON API — MEMBERS MODEL OUTPUT

Array<{
  name: string
  active: boolean
  sprite: string | null
  role: string
  shinies: Array<{
    pokemon: string
    date_catch?: string
    method: string | null
    encounter?: number | null
    secret: boolean
    alpha: boolean
    run: boolean
    lost: boolean
    sold: boolean
    favorite?: boolean
    clip: string | null
    notes: string | null
  }>
}>
*/

export function buildMembersModel(members, shinyShowcase) {
  const map = {};

  // Initialize members (PRIMARY)
  members.forEach(m => {
    const key = m.name.toLowerCase();

    map[key] = {
      name: m.name,
      active: m.active,
      sprite: m.sprite ?? null,
      role: m.role ?? '',
      shinies: []
    };
  });

  // Attach shinies (SECONDARY)
  shinyShowcase.forEach(s => {
    if (!s.ot) return;

    const key = s.ot.toLowerCase();

    // Allow ex-members / unknown OTs
    if (!map[key]) {
      map[key] = {
        name: s.ot,
        active: false,
        sprite: null,
        role: '',
        shinies: []
      };
    }

    map[key].shinies.push({
      pokemon: s.pokemon,
      date_catch: s.date_catch,
      method: s.method,
      encounter: s.encounter,
      secret: s.secret,
      alpha: s.alpha,
      run: s.run,
      lost: s.lost,
      sold: s.sold,
      favorite: s.favorite,
      clip: s.clip,
      notes: s.notes
    });
  });

  return Object.values(map);
}
