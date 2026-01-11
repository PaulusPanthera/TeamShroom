// shinyweekly.js
// Shiny Weekly — data aggregation only
// JSON-first runtime, CI-normalized identities

export function buildWeeklyViewModel(rawWeeks) {
  return rawWeeks.map(week => {
    const members = {};
    let shinyCount = 0;

    week.shinies.forEach(shiny => {
      const key = shiny.memberKey;

      members[key] ??= {
        key,
        name: shiny.memberName,
        shinies: []
      };

      members[key].shinies.push(shiny);
      shinyCount++;
    });

    const memberStats = Object.values(members)
      .map(m => ({
        key: m.key,
        name: m.name,
        count: m.shinies.length
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
            key: memberStats[0].key,
            name: memberStats[0].name,
            count: memberStats[0].count
          }
        : null,

      // grouped data for UI
      members
    };
  });
}
