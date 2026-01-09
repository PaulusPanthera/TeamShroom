// shinyweekly.ui.js
// Shiny Weekly — Unified Card Version with Shuffle Logic
// Member card → Pokémon cards → back to member

import { renderUnifiedCard } from './unifiedcard.js';
import { normalizePokemonName, prettifyPokemonName, normalizeMemberName } from './utils.js';

/* ===== Helpers ===== */

// Same Pokémon GIF logic as showcase
function getPokemonGif(name) {
  const n = name.replace(/[\s.'’\-]/g, "").toLowerCase();
  if (n === "mrmime") return "https://img.pokemondb.net/sprites/black-white/anim/shiny/mr-mime.gif";
  if (n === "mimejr") return "https://img.pokemondb.net/sprites/black-white/anim/shiny/mime-jr.gif";
  if (n === "nidoranf") return "https://img.pokemondb.net/sprites/black-white/anim/shiny/nidoran-f.gif";
  if (n === "nidoranm") return "https://img.pokemondb.net/sprites/black-white/anim/shiny/nidoran-m.gif";
  if (n === "typenull") return "https://img.pokemondb.net/sprites/black-white/anim/shiny/type-null.gif";
  if (n === "porygonz") return "https://img.pokemondb.net/sprites/black-white/anim/shiny/porygon-z.gif";

  const urlName = normalizePokemonName(name);
  return `https://img.pokemondb.net/sprites/black-white/anim/shiny/${urlName}.gif`;
}

// Member sprite fallback logic (png → gif → jpg)
function applyMemberSprite(imgEl, memberName) {
  const base = normalizeMemberName(memberName);
  const formats = ['png', 'gif', 'jpg'];
  let idx = 0;

  function tryNext() {
    if (idx >= formats.length) return;
    const url = `img/membersprites/${base}sprite.${formats[idx]}`;
    const testImg = new Image();
    testImg.onload = () => {
      imgEl.src = url;
    };
    testImg.onerror = () => {
      idx++;
      tryNext();
    };
    testImg.src = url;
  }

  // start with placeholder
  imgEl.src = "img/membersprites/examplesprite.png";
  tryNext();
}

/* ===== Main Render ===== */

export function renderShinyWeekly(weeks, container) {
  if (!container || !Array.isArray(weeks)) return;
  container.innerHTML = "";

  // Newest week first
  const orderedWeeks = [...weeks].reverse();

  orderedWeeks.forEach((week, weekIndex) => {
    const weekCard = document.createElement("div");
    weekCard.className = "weekly-card";

    /* ===== Header ===== */
    const header = document.createElement("div");
    header.className = "weekly-header";
    header.innerHTML = `
      <div class="weekly-title">${week.label || week.week}</div>
      <div class="weekly-meta">
        ⭐ ${week.shinies.length} Shinies • 👥 ${
          new Set(week.shinies.map(s => s.member)).size
        } Hunters
      </div>
    `;

    /* ===== Body ===== */
    const body = document.createElement("div");
    body.className = "weekly-body";
    body.style.display = weekIndex === 0 ? "block" : "none";

    const grid = document.createElement("div");
    grid.className = "dex-grid"; // reuse existing grid styling

    /* Group shinies by member */
    const byMember = {};
    week.shinies.forEach(shiny => {
      if (!byMember[shiny.member]) byMember[shiny.member] = [];
      byMember[shiny.member].push(shiny);
    });

    Object.entries(byMember).forEach(([member, shinies]) => {
      let stateIndex = -1; // -1 = member card, >=0 = pokemon index

      const wrapper = document.createElement("div");

      function renderState() {
        wrapper.innerHTML = "";

        // MEMBER CARD
        if (stateIndex === -1) {
          wrapper.innerHTML = renderUnifiedCard({
            name: member,
            img: "img/membersprites/examplesprite.png",
            info: `Shinies: ${shinies.length}`,
            cardType: "member"
          });

          const img = wrapper.querySelector(".unified-img");
          applyMemberSprite(img, member);
        }
        // POKÉMON CARD
        else {
          const shiny = shinies[stateIndex];
          const displayName = prettifyPokemonName(shiny.name);

          wrapper.innerHTML = renderUnifiedCard({
            name: displayName,
            img: getPokemonGif(shiny.name),
            info: "",
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
        }

        const card = wrapper.firstElementChild;
        card.style.cursor = "pointer";

        card.onclick = () => {
          stateIndex++;
          if (stateIndex >= shinies.length) {
            stateIndex = -1; // back to member
          }
          renderState();
        };
      }

      renderState();
      grid.appendChild(wrapper);
    });

    body.appendChild(grid);

    header.onclick = () => {
      body.style.display = body.style.display === "none" ? "block" : "none";
    };

    weekCard.appendChild(header);
    weekCard.appendChild(body);
    container.appendChild(weekCard);
  });
}
