// shinyweekly.model.js
// Transforms flat shiny rows into weekly grouped structure

export function buildShinyWeeklyModel(rows) {
  const weeks = {};

  rows.forEach(r => {
    const key = r.week;

    if (!weeks[key]) {
      weeks[key] = {
        week: r.week,
        label: r.week_label,
        date_start: r.date_start,
        date_end: r.date_end,
        shinies: []
      };
    }

    weeks[key].shinies.push({
      member: r.ot,
      name: r.pokemon,
      method: r.method || null,
      encounter: r.encounter || null,

      secret: !!r.secret,
      alpha: !!r.alpha,
      run: !!r.run,
      lost: !!r.lost,

      clip: r.clip || null,
      notes: r.notes || null
    });
  });

  return Object.values(weeks).sort(
    (a, b) => new Date(a.date_start) - new Date(b.date_start)
  );
}
