// src/data/shinyweekly.model.js
// Shiny Weekly — aggregation model
// CI-normalized flat rows → UI-ready weekly structure

/*
INTERNAL JSON API — SHINY WEEKLY MODEL OUTPUT

Array<{
  week: string
  label: string
  shinyCount: number
  hunterCount: number
  members: {
    [memberKey: string]: {
      key: string
      name: string
      shinies: Array<{
        member: string
        pokemon: string
        method: string | null
        encounter: string | null
        secret: boolean
        alpha: boolean
        run: boolean
        lost: boolean
        clip: string | null
        notes: string | null
      }>
    }
  }
}>
*/

export function buildShinyWeeklyModel(rows) {
  const weeks = {};

  rows.forEach(row => {
    const weekKey = row.week;
    const memberKey = row.ot;

    if (!weeks[weekKey]) {
      weeks[weekKey] = {
        week: row.week,
        label: row.week_label || row.week,
        members: {},
        shinyCount: 0
      };
    }

    const week = weeks[weekKey];

    if (!week.members[memberKey]) {
      week.members[memberKey] = {
        key: memberKey,
        name: memberKey,
        shinies: []
      };
    }

    week.members[memberKey].shinies.push({
      member: row.ot,
      pokemon: row.pokemon,
      method: row.method,
      encounter: row.encounter,
      secret: row.secret,
      alpha: row.alpha,
      run: row.run,
      lost: row.lost,
      clip: row.clip,
      notes: row.notes
    });

    week.shinyCount++;
  });

  return Object.values(weeks).map(week => ({
    ...week,
    hunterCount: Object.keys(week.members).length
  }));
}
