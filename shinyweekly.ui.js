// shinyweekly.ui.js
// Renders Shiny Weekly UI (ES MODULE VERSION, STRING-BASED CARDS)

import { renderUnifiedCard } from './unifiedcard.js';

export function renderShinyWeekly(containerId, rawWeeklyData) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";

  if (!Array.isArray(rawWeeklyData) || rawWeeklyData.length === 0) {
    container.innerHTML = `<div style="opacity:.7;text-align:center;">No weekly data available.</div>`;
    return;
  }

  rawWeeklyData.forEach((week, weekIndex) => {
    const weekCard = document.createElement("div");
    weekCard.className = "weekly-card";

    /* ================= HEADER ================= */
    const header = document.createElement("div");
    header.className = "weekly-header";
    header.innerHTML = `
      <div class="weekly-title">${week.label || week.week}</div>
      <div class="weekly-meta">⭐ ${week.shinies.length} Shinies</div>
    `;

    /* ================= BODY ================= */
    const body = document.createElement("div");
    body.className = "weekly-body";
    body.style.display = weekIndex === 0 ? "block" : "none";

    /* Group shinies by member */
    const memberMap = {};
    week.shinies.forEach(shiny => {
      if (!memberMap[shiny.member]) memberMap[shiny.member] = [];
      memberMap[shiny.member].push(shiny);
    });

    Object.entries(memberMap).forEach(([member, shinies]) => {
      const memberRow = document.createElement("div");
      memberRow.className = "weekly-member-row";

      /* Member header */
      const memberHeader = document.createElement("div");
      memberHeader.className = "weekly-member-header";
      memberHeader.innerHTML = `
        <img class="weekly-member-sprite"
             src="img/membersprites/${member.toLowerCase()}sprite.png"
             onerror="this.onerror=null;this.src='img/membersprites/examplesprite.png';">
        <span>${member}</span>
        <span class="weekly-member-count">${shinies.length}</span>
      `;

      /* Grid */
      const grid = document.createElement("div");
      grid.className = "weekly-shiny-grid";

      shinies.forEach(shiny => {
        // renderUnifiedCard RETURNS A STRING → convert safely to DOM
        const temp = document.createElement("div");
        temp.innerHTML = renderUnifiedCard({
          name: shiny.name,
          img: getPokemonGif(shiny.name),
          info: "",
          lost: !!shiny.lost,
          cardType: "pokemon",
          symbols: {
            secret: !!shiny.secret,
            safari: !!shiny.safari,
            egg: !!shiny.egg,
            event: !!shiny.event,
            alpha: !!shiny.alpha,
            clip: !!shiny.clip
          }
        });

        const card = temp.firstElementChild;
        if (card) grid.appendChild(card);
      });

      memberRow.appendChild(memberHeader);
      memberRow.appendChild(grid);
      body.appendChild(memberRow);
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

/* ================= HELPERS ================= */

function getPokemonGif(name) {
  const n = name.toLowerCase().replace(/[\s.'’\-]/g, "");
  if (n === "mrmime") return "https://img.pokemondb.net/sprites/black-white/anim/shiny/mr-mime.gif";
  if (n === "mimejr") return "https://img.pokemondb.net/sprites/black-white/anim/shiny/mime-jr.gif";
  if (n === "nidoranf") return "https://img.pokemondb.net/sprites/black-white/anim/shiny/nidoran-f.gif";
  if (n === "nidoranm") return "https://img.pokemondb.net/sprites/black-white/anim/shiny/nidoran-m.gif";
  if (n === "typenull") return "https://img.pokemondb.net/sprites/black-white/anim/shiny/type-null.gif";
  if (n === "porygonz") return "https://img.pokemondb.net/sprites/black-white/anim/shiny/porygon-z.gif";

  return `https://img.pokemondb.net/sprites/black-white/anim/shiny/${n}.gif`;
}
