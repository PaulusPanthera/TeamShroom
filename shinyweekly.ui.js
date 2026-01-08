// shinyweekly.ui.js
// STEP 1: Text-only renderer to validate data flow (NO cards, NO sprites)

export function renderShinyWeekly(rawWeeklyData, container) {
  if (!container) {
    console.error("ShinyWeekly: container not found");
    return;
  }

  if (!Array.isArray(rawWeeklyData)) {
    console.error("ShinyWeekly: data is not an array", rawWeeklyData);
    return;
  }

  container.innerHTML = "";

  rawWeeklyData.forEach((week, weekIndex) => {
    const weekBlock = document.createElement("div");
    weekBlock.style.border = "2px solid var(--accent)";
    weekBlock.style.margin = "1.5em 0";
    weekBlock.style.padding = "1em";
    weekBlock.style.background = "var(--card)";

    // Week header
    const header = document.createElement("h2");
    header.textContent = week.label || week.week || `Week ${weekIndex + 1}`;
    header.style.marginBottom = "0.5em";
    weekBlock.appendChild(header);

    if (!Array.isArray(week.shinies)) {
      const err = document.createElement("div");
      err.textContent = "⚠️ No shinies array found for this week";
      weekBlock.appendChild(err);
      container.appendChild(weekBlock);
      return;
    }

    // Group by member
    const byMember = {};
    week.shinies.forEach(shiny => {
      if (!byMember[shiny.member]) byMember[shiny.member] = [];
      byMember[shiny.member].push(shiny);
    });

    Object.entries(byMember).forEach(([member, shinies]) => {
      const memberBlock = document.createElement("div");
      memberBlock.style.margin = "0.75em 0 0.75em 1em";

      const memberTitle = document.createElement("div");
      memberTitle.innerHTML = `<strong>${member}</strong> (${shinies.length})`;
      memberBlock.appendChild(memberTitle);

      const list = document.createElement("ul");
      list.style.marginLeft = "1.5em";

      shinies.forEach(shiny => {
        const li = document.createElement("li");

        let label = shiny.name;

        const tags = [];
        if (shiny.secret) tags.push("secret");
        if (shiny.safari) tags.push("safari");
        if (shiny.egg) tags.push("egg");
        if (shiny.event) tags.push("event");
        if (shiny.lost) tags.push("lost");

        if (tags.length) {
          label += ` (${tags.join(", ")})`;
        }

        li.textContent = label;
        list.appendChild(li);
      });

      memberBlock.appendChild(list);
      weekBlock.appendChild(memberBlock);
    });

    container.appendChild(weekBlock);
  });

  console.log("✅ ShinyWeekly STEP 1 render complete");
}
