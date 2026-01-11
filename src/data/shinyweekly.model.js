// src/data/shinyweekly.model.js
// Shiny Weekly — aggregation model
// CI-normalized input → UI-ready output

export function buildShinyWeeklyModel(rows) {
  const weeks = {};

  rows.forEach(row => {
    const key = row.week;

    if (!weeks[key]) {
      weeks[key] = {
        week: row.week,
        label: row.week_label || row.week,
        shinies: []
      };
    }

    weeks[key].shinies.push({
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
  });

  return Object.values(weeks);
}
