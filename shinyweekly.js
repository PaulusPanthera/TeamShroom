// shinyweekly.js
// Responsible ONLY for data normalization & stats

export function buildWeeklyViewModel(rawWeeks) {
  return rawWeeks.map((week, index) => {
    const members = {};
    let shinyCount = 0;

    week.shinies.forEach(shiny => {
      if (!members[shiny.member]) members[shiny.member] = [];
      members[shiny.member].push(shiny);
      shinyCount++;
    });

    const memberStats = Object.entries(members)
      .map(([name, shinies]) => ({ name, count: shinies.length }))
      .sort((a, b) => b.count - a.count);

    return {
      week: week.week,
      label: week.label,
      index,
      shinyCount,
      hunterCount: Object.keys(members).length,
      topHunter: memberStats.length
        ? `${memberStats[0].name} (${memberStats[0].count})`
        : null,
      members
    };
  });
}
