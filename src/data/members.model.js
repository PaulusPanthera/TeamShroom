/**
 * Members model builder
 *
 * Primary data: members.json
 * Secondary data: shinyshowcase.json
 *
 * Output:
 * [
 *   {
 *     name,
 *     active,
 *     sprite,
 *     role,
 *     shinies: []
 *   }
 * ]
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
