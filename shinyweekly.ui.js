// shinyweekly.ui.js
// Stable Shiny Weekly – Unified Cards, safe paths, no experiments

import { renderUnifiedCard } from "./unifiedcard.js";
import { normalizePokemonName, normalizeMemberName } from "./utils.js";

/* ============================= */
/* HELPERS                       */
/* ============================= */

function getPokemonGif(name) {
  const n = normalizePokemonName(name);

  const special = {
    "mr-mime": "mr-mime",
    "mime-jr": "mime-jr",
    "porygon-z": "porygon-z",
    "type-null": "type-null",
    "nidoran-f": "nidoran-f",
    "nidoran-m": "nidoran-m"
  };

  const key = special[n] || n;
  return `https://img.pokemondb.net/sprites/black-white/anim/shiny/${key}.gif`;
}

function loadMemberSprite(imgEl, memberName) {
  const base = normalizeMemberName(memberName);
  const placeholder = "/img/membersprites/examplesprite.png";

  imgEl.src = placeholder;

  const formats = ["gif", "png", "jpg"];
  let idx = 0;

  function tryNext() {
    if (idx >= formats.length) return;
    const testSrc = `/img/membersprites/${base}sprite.${formats[idx++]}`;
    const probe = new Image();
    probe.onload = () => (imgEl.src = testSrc);
    probe.onerror = tryNext;
    probe.src = testSrc;
  }

  tryNext();
}

/* ============================= */
/* MAIN RENDER                   */
/* ============================= */

export function renderShinyWeekly(weeks, container) {
  if (!container || !Array.isArray(weeks)) return;

  container.innerHTML = "";

  // newest week first
  const sortedWeeks = [...weeks].reverse();

  sortedWeeks.forEach((week, weekIndex) => {
    const weekCard = document.createElement("div");
    weekCard.className = "weekly-card";

    /* ---------- HEADER ---------- */
    const header = document.createElement("div");
    header.className = "weekly-header";

    const hunterCount = new Set(week.shinies.map(s => s.member)).size;

    header.innerHTML = `
      <div class="weekly-title">${week.label || week.week}</div>
      <div class="weekly-meta">
        ⭐ ${week.shinies.length} Shinies · 👥 ${hunterCount} Hunters
      </div>
    `;

    /* ---------- BODY ---------- */
    const body = document.createElement("div");
    body.className = "weekly-body";
    body.style.display = weekIndex === 0 ? "block" : "none";

    const grid = document.createElement("div");
    grid.className = "dex-grid";
    body.appendChild(grid);

    /* ---------- GROUP BY MEMBER ---------- */
    const byMember = {};
    week.shinies.forEach(s => {
      if (!byMember[s.member]) byMember[s.member] = [];
      byMember[s.member].push(s);
    });

    Object.entries(byMember).forEach(([member, shinies]) => {
      let currentIndex = -1;
      let showingMember = true;

      /* MEMBER CARD */
      const memberWrapper = document.createElement("div");
      memberWrapper.innerHTML = renderUnifiedCard({
        name: member,
        img: "/img/membersprites/examplesprite.png",
        info: `Shinies: ${shinies.length}`,
        cardType: "member"
      });

      const memberCard = memberWrapper.firstElementChild;
      grid.appendChild(memberCard);

      const memberImg = memberCard.querySelector(".unified-img");
      loadMemberSprite(memberImg, member);

      /* CLICK LOGIC */
      memberCard.addEventListener("click", () => {
        if (showingMember) {
          currentIndex = 0;
          showPokemon();
        }
      });

      function showPokemon() {
        const shiny = shinies[currentIndex];

        const pokeWrapper = document.createElement("div");
        pokeWrapper.innerHTML = renderUnifiedCard({
          name: shiny.name,
          img: getPokemonGif(shiny.name),
          info: member,
          lost: shiny.lost,
          cardType: "pokemon",
          symbols: {
            secret: !!shiny.secret,
            safari: !!shiny.safari,
            egg: !!shiny.egg,
            event: !!shiny.event,
            alpha: !!shiny.alpha
          }
        });

        const pokeCard = pokeWrapper.firstElementChild;
        grid.replaceChild(pokeCard, showingMember ? memberCard : grid.children[gridIndex()]);
        showingMember = false;

        pokeCard.addEventListener("click", () => {
          currentIndex++;
          if (currentIndex >= shinies.length) {
            grid.replaceChild(memberCard, pokeCard);
            showingMember = true;
            currentIndex = -1;
          } else {
            showPokemon();
          }
        });
      }

      function gridIndex() {
        return Array.from(grid.children).indexOf(
          showingMember ? memberCard : grid.querySelector(`[data-name="${shinies[currentIndex - 1]?.name}"]`)
        );
      }
    });

    header.addEventListener("click", () => {
      body.style.display = body.style.display === "none" ? "block" : "none";
    });

    weekCard.appendChild(header);
    weekCard.appendChild(body);
    container.appendChild(weekCard);
  });
}
