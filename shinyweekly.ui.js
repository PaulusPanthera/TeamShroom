/* shinyweekly.ui.js */
/* Renders Shiny Weekly UI only */

function renderShinyWeekly(containerId, rawWeeklyData) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";

  const weeks = buildWeeklyViewModel(rawWeeklyData);

  weeks.forEach((week, idx) => {
    const weekCard = document.createElement("div");
    weekCard.className = "weekly-card";

    /* ===== HEADER ===== */
    const header = document.createElement("div");
    header.className = "weekly-header";
    header.innerHTML = `
      <div class="weekly-title">${week.label}</div>
      <div class="weekly-meta">
        ⭐ ${week.shinyCount} Shinies
        &nbsp;•&nbsp;
        👥 ${week.hunterCount} Hunters
        ${week.topHunter ? `&nbsp;•&nbsp; 🏆 ${week.topHunter}` : ""}
      </div>
    `;

    /* ===== BODY ===== */
    const body = document.createElement("div");
    body.className = "weekly-body";
    body.style.display = idx === 0 ? "block" : "none"; // latest open

    Object.entries(week.members).forEach(([member, shinies]) => {
      const memberBlock = document.createElement("div");
      memberBlock.className = "weekly-member-row";

      /* Member header */
      const memberHeader = document.createElement("div");
      memberHeader.className = "weekly-member-header";
      memberHeader.innerHTML = `
        <img class="weekly-member-sprite"
             src="img/membersprites/${member.toLowerCase()}sprite.png"
             onerror="this.src='img/membersprites/examplesprite.png'">
        <span>${member}</span>
        <span class="weekly-member-count">${shinies.length}</span>
      `;

      /* Shiny grid */
      const grid = document.createElement("div");
      grid.className = "weekly-shiny-grid";

      shinies.forEach(shiny => {
        const cardHTML = renderUnifiedCard({
          name: shiny.name,
          img: `img/pokemon/${shiny.name.toLowerCase()}.png`,
          info: "",
          lost: shiny.lost,
          cardType: "pokemon",
          symbols: {
            secret: shiny.secret,
            safari: shiny.safari,
            egg: shiny.egg,
            event: shiny.event
          }
        });

        const wrapper = document.createElement("div");
        wrapper.innerHTML = cardHTML;
        grid.appendChild(wrapper.firstElementChild);
      });

      memberBlock.appendChild(memberHeader);
      memberBlock.appendChild(grid);
      body.appendChild(memberBlock);
    });

    /* Toggle open/close */
    header.addEventListener("click", () => {
      body.style.display = body.style.display === "none" ? "block" : "none";
    });

    weekCard.appendChild(header);
    weekCard.appendChild(body);
    container.appendChild(weekCard);
  });
}

/* Export globally */
window.renderShinyWeekly = renderShinyWeekly;
