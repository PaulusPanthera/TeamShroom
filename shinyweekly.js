// shinyweekly.js
// Shiny Weekly — data normalization & stats only
// No rendering. No UI assumptions.

export function buildWeeklyViewModel(rawWeeks) {
  return rawWeeks.map(week => {
    const members = {};
    let shinyCount = 0;

    week.shinies.forEach(shiny => {
      members[shiny.member] ??= [];
      members[shiny.member].push(shiny);
      shinyCount++;
    });

    const memberStats = Object.entries(members)
      .map(([name, shinies]) => ({
        name,
        count: shinies.length
      }))
      .sort((a, b) => b.count - a.count);

    return {
      week: week.week,
      label: week.label || week.week,

      // aggregate stats
      shinyCount,
      hunterCount: memberStats.length,

      // derived highlights
      topHunter: memberStats.length
        ? {
            name: memberStats[0].name,
            count: memberStats[0].count
          }
        : null,

      // raw grouped data (used by UI layer)
      members
    };
    import { loadShinyWeeklyFromCSV } from './shinyweekly.loader.js';

const SHINY_WEEKLY_CSV =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vTB6vHVjwL9_F3DVIVgXxP8rtWEDQyZaDTnG2yAw96j4_1DXU7317lBFaY0N5JnDhdvUnkvgAvb6p8o/pub?gid=0&single=true&output=csv';

loadShinyWeeklyFromCSV(SHINY_WEEKLY_CSV).then(data => {
  console.log('Shiny Weekly rows:', data);
});
  });
}
