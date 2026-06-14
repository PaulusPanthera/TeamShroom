// src/data/members.model.js
// v2.0.0-beta
// Members model builder. Preserves roster metadata while attaching showcase shinies.

/*
INTERNAL JSON API — MEMBERS MODEL OUTPUT

Array<{
  name: string
  active: boolean
  sprite: string | null
  role: string
  member_since: string
  nationality: string
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

function normalizeOptionalString(value) {
  return String(value || '').trim();
}

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
      member_since: normalizeOptionalString(m.member_since),
      nationality: normalizeOptionalString(m.nationality),
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
        member_since: '',
        nationality: '',
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
