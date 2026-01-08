// shinyweekly.ui.js
// STEP 2: Shiny Weekly renderer with unified cards (string-based, safe)

import { renderUnifiedCard } from './unifiedcard.js';

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

    // ---- WEEK HEADER ----
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

    // ---- GROUP BY MEMBER ----
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
      list.style.marginLeft = "1.2em";
      list.style.padding = "0";
      list.style.listStyle = "none";

      // ---- SHINY CARDS ----
      shinies.forEach(shiny => {
        list.insertAdjacentHTML(
          "beforeend",
          `
            <li style="margin: 0.4em 0;">
              ${renderUnifiedCard({
                name: shiny.name,
                img: `img/pokemon/${shiny.name}.gif`,
                info: "",
                lost: shiny.lost,
                cardType: "pokemon",
                symbols: {
                  secret: shiny.secret,
                  safari: shiny.safari,
                  egg: shiny.egg,
                  event: shiny.event,
                  alpha: shiny.alpha,
                  clip: shiny.clip
                }
              })}
            </li>
          `
        );
      });

      memberBlock.appendChild(list);
      weekBlock.appendChild(memberBlock);
    });

    container.appendChild(weekBlock);
  });

  console.log("✅ ShinyWeekly STEP 2 render complete");
}
