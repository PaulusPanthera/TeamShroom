// shinydexsearch.js
// ES module version for Shiny Dex Hitlist, Living Dex, filtering, tooltips

import { renderUnifiedCard } from './unifiedcard.js';
import { normalizePokemonName, prettifyPokemonName } from './utils.js';

// --- Helper to build a GIF URL for a Pokémon ---
function getPokemonGif(name) {
  // Lowercase, remove special chars for matching
  const n = name.toLowerCase().replace(/[\s.'’\-]/g, "");
  if (
    name === "Mr. Mime" ||
    name === "mr.mime" ||
    name === "mr-mime" ||
    n === "mrmime"
  ) return "https://img.pokemondb.net/sprites/black-white/anim/shiny/mr-mime.gif";
  if (
    name === "Mime Jr." ||
    name === "mime.jr" ||
    name === "mime-jr" ||
    n === "mimejr"
  ) return "https://img.pokemondb.net/sprites/black-white/anim/shiny/mime-jr.gif";
  if (name === "Nidoran♀" || name === "nidoran♀" || name === "nidoran-f" || name === "nidoranf") return "https://img.pokemondb.net/sprites/black-white/anim/shiny/nidoran-f.gif";
  if (name === "Nidoran♂" || name === "nidoran♂" || name === "nidoran-m" || name === "nidoranm") return "https://img.pokemondb.net/sprites/black-white/anim/shiny/nidoran-m.gif";
  if (name === "Type: Null" || name === "type:null" || name === "type-null" || name === "typenull") return "https://img.pokemondb.net/sprites/black-white/anim/shiny/type-null.gif";
  if (name === "Porygon-Z" || name === "porygon-z" || name === "porygonz") return "https://img.pokemondb.net/sprites/black-white/anim/shiny/porygon-z.gif";

  let urlName = normalizePokemonName(name);
  return `https://img.pokemondb.net/sprites/black-white/anim/shiny/${urlName}.gif`;
}

// --- Flatten shinyDex into a list ---
function flattenDexData(shinyDex) {
  const result = [];
  Object.entries(shinyDex).forEach(([region, entries]) => {
    entries.forEach((entry, idx, arr) => {
      result.push({ ...entry, region, familyIndex: idx, familyArr: arr });
    });
  });
  return result;
}

// --- Map members to their claims ---
function getMemberClaims(flattened, POKEMON_POINTS) {
  const memberMap = {};
  flattened.forEach(e => {
    const normName = normalizePokemonName(e.name);
    const pts = POKEMON_POINTS && POKEMON_POINTS[normName];
    if (typeof e.claimed === 'string' && e.claimed && e.claimed !== "NA" && pts && pts !== "NA") {
      if (!memberMap[e.claimed]) memberMap[e.claimed] = [];
      memberMap[e.claimed].push(e);
    }
  });
  return memberMap;
}

// --- Build Living Dex counts from teamShowcase data ---
function buildLivingDexCounts(teamShowcase, POKEMON_POINTS) {
  const counts = {};
  teamShowcase.forEach(member => {
    if (!member.shinies) return;
    member.shinies.forEach(shiny => {
      if (shiny.lost) return;
      let name = normalizePokemonName(shiny.name || "");
      // Only count if points are not NA
      if (POKEMON_POINTS && (POKEMON_POINTS[name] === undefined || POKEMON_POINTS[name] === "NA")) return;
      counts[name] = (counts[name] || 0) + 1;
    });
  });
  return counts;
}

// --- Get points for a Pokémon ---
function getPointsForPokemon(name, POKEMON_POINTS) {
  if (!POKEMON_POINTS) return 1;
  let normName = normalizePokemonName(name);
  let pts = POKEMON_POINTS[normName];
  if (!pts || pts === "NA") return 0;
  return pts;
}

// --- FILTER LOGIC ---

function filterEntry(entry, filter, pokemonFamilies, POKEMON_POINTS) {
  const normName = normalizePokemonName(entry.name);
  const pts = POKEMON_POINTS && POKEMON_POINTS[normName];
  // Exclude NA Pokémon everywhere
  if (!pts || pts === "NA" || entry.claimed === "NA") return false;

  if (!filter) return true;

  // +family search (at start or end)
  let plusFamily = false, familySearch = "";
  if (filter.startsWith("+") && filter.length > 1) {
    plusFamily = true;
    familySearch = filter.slice(1).trim().toLowerCase();
  } else if (filter.endsWith("+") && filter.length > 1) {
    plusFamily = true;
    familySearch = filter.slice(0, -1).trim().toLowerCase();
  }
  if (plusFamily) {
    if (!pokemonFamilies) return false;
    let baseName = normalizePokemonName(entry.name);
    let family = pokemonFamilies[baseName];
    if (!family) return false;
    return family.some(famName => famName.toLowerCase().includes(familySearch));
  }

  // Claimed/unclaimed text search
  if (filter === "claimed") return !!entry.claimed && entry.claimed !== "NA";
  if (filter === "unclaimed") return !entry.claimed || entry.claimed === "NA";

  // --- Region search support (case-insensitive, exact match) ---
  if (
    typeof entry.region === "string" &&
    entry.region.trim().toLowerCase() === filter.trim().toLowerCase()
  ) return true;

  // Otherwise, match name or claimed string
  let nameMatch = entry.name.toLowerCase().includes(filter);
  let claimedMatch = entry.claimed && typeof entry.claimed === "string"
    ? entry.claimed.toLowerCase().includes(filter)
    : false;
  return nameMatch || claimedMatch;
}

// --- Renders ---

function renderShinyDexFiltered(regions, filter, pokemonFamilies, POKEMON_POINTS) {
  const container = document.getElementById('shiny-dex-container');
  if (!container) return;
  container.innerHTML = '';
  let totalShown = 0;
  Object.keys(regions).forEach(region => {
    const filteredEntries = regions[region].filter(entry =>
      filterEntry(entry, filter, pokemonFamilies, POKEMON_POINTS)
    );
    if (!filteredEntries.length) return;
    totalShown += filteredEntries.length;
    const regionDiv = document.createElement('div');
    regionDiv.className = 'region-section';
    regionDiv.innerHTML = `<h2>${region}</h2>`;

    const grid = document.createElement('div');
    grid.className = 'dex-grid';

    filteredEntries.forEach(entry => {
      const normName = normalizePokemonName(entry.name);
      const pts = POKEMON_POINTS && POKEMON_POINTS[normName];
      // Skip NA again for safety
      if (!pts || pts === "NA" || entry.claimed === "NA") return;
      // Do not show points in (standard) mode; only show claimed name or "Unclaimed"
      let info = (entry.claimed && entry.claimed !== "NA") ? entry.claimed : "Unclaimed";
      grid.innerHTML += renderUnifiedCard({
        name: entry.name,
        img: getPokemonGif(entry.name),
        info,
        unclaimed: !entry.claimed || entry.claimed === "NA",
        cardType: "pokemon"
      });
    });
    regionDiv.appendChild(grid);
    container.appendChild(regionDiv);
  });

  // Card click handlers for future use
  setTimeout(() => {
    const container = document.getElementById('shiny-dex-container');
    if (!container) return;
    container.querySelectorAll('.unified-card').forEach(card => {
      card.style.cursor = 'pointer';
      card.onclick = function (e) {
        if (window.getSelection && window.getSelection().toString()) return;
        const cardType = card.getAttribute('data-card-type');
        const cardName = card.getAttribute('data-name');
        if (cardType === "pokemon") {
          // Future: open Pokédex view, etc.
          // location.hash = `#pokedex-${cardName}`;
        }
      };
    });
  }, 0);
  return totalShown;
}

function renderScoreboardFiltered(flattened, filter, sortByPoints, POKEMON_POINTS, pokemonFamilies) {
  const container = document.getElementById('shiny-dex-container');
  if (!container) return;
  container.innerHTML = '';

  const memberMap = getMemberClaims(flattened, POKEMON_POINTS);
  let allMembers = Object.entries(memberMap)
    .map(([member, pokes]) => ({
      member,
      pokes: pokes.filter(entry => filterEntry(entry, filter, pokemonFamilies, POKEMON_POINTS)),
      points: pokes.reduce((sum, entry) => sum + getPointsForPokemon(entry.name, POKEMON_POINTS), 0)
    }))
    .filter(m => m.pokes.length > 0);

  if (sortByPoints) {
    allMembers.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.pokes.length !== a.pokes.length) return b.pokes.length - a.pokes.length;
      return a.member.localeCompare(b.member);
    });
  } else {
    allMembers.sort((a, b) => {
      if (b.pokes.length !== a.pokes.length) return b.pokes.length - a.pokes.length;
      if (b.points !== a.points) return b.points - a.points;
      return a.member.localeCompare(b.member);
    });
  }

  let totalShown = 0;
  allMembers.forEach(({ member, pokes, points }, idx) => {
    totalShown += pokes.length;
    const section = document.createElement('section');
    section.className = 'scoreboard-member-section';
    section.style.marginBottom = "2em";
    section.innerHTML = `<h2>
#${idx + 1} ${member} <span style="font-size:0.7em;font-weight:normal;color:var(--text-main);">(${pokes.length} Claims, ${points} Points)</span>
</h2>
<div class="dex-grid"></div>
    `;
    const grid = section.querySelector('.dex-grid');
    pokes.sort((a, b) => a.name.localeCompare(b.name));
    pokes.forEach(entry => {
      const normName = normalizePokemonName(entry.name);
      const pts = POKEMON_POINTS && POKEMON_POINTS[normName];
      if (!pts || pts === "NA" || entry.claimed === "NA") return;
      grid.innerHTML += renderUnifiedCard({
        name: entry.name,
        img: getPokemonGif(entry.name),
        info: `${pts} Points`,
        cardType: "pokemon"
      });
    });
    section.appendChild(grid);
    container.appendChild(section);
  });

  if (allMembers.length === 0) {
    container.innerHTML = `<div style="color:#e0e0e0;font-size:1.2em;">No members found.</div>`;
  }

  // Card click handlers for future use
  setTimeout(() => {
    container.querySelectorAll('.unified-card').forEach(card => {
      card.style.cursor = 'pointer';
      card.onclick = function (e) {
        if (window.getSelection && window.getSelection().toString()) return;
        const cardType = card.getAttribute('data-card-type');
        const cardName = card.getAttribute('data-name');
        if (cardType === "pokemon") {
          // Future: open Pokédex view, etc.
          // location.hash = `#pokedex-${cardName}`;
        }
      };
    });
  }, 0);
  return totalShown;
}

// --- Living Dex with Custom Tooltip Support ---
function renderLivingDexFiltered(shinyDex, teamShowcase, filter, sortMode = "standard", pokemonFamilies, POKEMON_POINTS) {
  const container = document.getElementById('shiny-dex-container');
  if (!container) return;
  container.innerHTML = '';
  const counts = buildLivingDexCounts(teamShowcase, POKEMON_POINTS);

  function getOwners(entry) {
    const entryNorm = normalizePokemonName(entry.name);
    let owners = [];
    for (const member of teamShowcase) {
      if (!Array.isArray(member.shinies)) continue;
      for (const shiny of member.shinies) {
        if (shiny.lost) continue;
        if (normalizePokemonName(shiny.name) === entryNorm) {
          owners.push(member.name);
          break; // Only show each member once per mon
        }
      }
    }
    return owners;
  }

  function createCard(entry, count, owners) {
    const normName = normalizePokemonName(entry.name);
    const pts = POKEMON_POINTS && POKEMON_POINTS[normName];
    if (!pts || pts === "NA" || entry.claimed === "NA") return null;
    // Never show points for Living Dex
    const temp = document.createElement("div");
    temp.innerHTML = renderUnifiedCard({
      name: entry.name,
      img: getPokemonGif(entry.name),
      info: `<span class="livingdex-count">${count}</span>`,
      cardType: "pokemon"
    });
    const card = temp.firstElementChild;
    card._owners = owners;
    return card;
  }

  if (sortMode === "totals") {
    let allEntries = [];
    Object.keys(shinyDex).forEach(region => {
      shinyDex[region].forEach(entry => {
        allEntries.push({ ...entry, region, count: counts[normalizePokemonName(entry.name)] || 0 });
      });
    });
    allEntries.sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.name.localeCompare(b.name);
    });
    let filtered = allEntries.filter(entry => filterEntry(entry, filter, pokemonFamilies, POKEMON_POINTS));
    let totalShown = filtered.length;

    const regionDiv = document.createElement('div');
    regionDiv.className = 'region-section';
    regionDiv.innerHTML = `<h2>Pokémon with Most Living Shinies</h2>`;
    const grid = document.createElement('div');
    grid.className = 'dex-grid';
    filtered.forEach(entry => {
      let owners = getOwners(entry);
      let card = createCard(entry, entry.count, owners);
      if (card) grid.appendChild(card);
    });
    regionDiv.appendChild(grid);
    container.appendChild(regionDiv);
    setupLivingDexOwnerTooltips();
    return totalShown;
  } else {
    let totalShown = 0;
    Object.keys(shinyDex).forEach(region => {
      const filteredEntries = shinyDex[region].filter(entry => filterEntry(entry, filter, pokemonFamilies, POKEMON_POINTS));
      if (!filteredEntries.length) return;
      totalShown += filteredEntries.length;

      const regionDiv = document.createElement('div');
      regionDiv.className = 'region-section';
      regionDiv.innerHTML = `<h2>${region}</h2>`;

      const grid = document.createElement('div');
      grid.className = 'dex-grid';

      filteredEntries.forEach(entry => {
        let nName = normalizePokemonName(entry.name);
        let count = counts[nName] || 0;
        let owners = getOwners(entry);
        let card = createCard(entry, count, owners);
        if (card) grid.appendChild(card);
      });

      regionDiv.appendChild(grid);
      container.appendChild(regionDiv);
    });
    setupLivingDexOwnerTooltips();
    return totalShown;
  }
}

// --- Custom tooltip logic for Living Dex (robust positioning) ---
function setupLivingDexOwnerTooltips() {
  let tooltipDiv = document.querySelector('.dex-owner-tooltip');
  if (!tooltipDiv) {
    tooltipDiv = document.createElement('div');
    tooltipDiv.className = 'dex-owner-tooltip';
    document.body.appendChild(tooltipDiv);
  }

  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  function showOwnerTooltip(target, ownerNames, mouseEvent = null) {
    if (!ownerNames || !ownerNames.length) {
      tooltipDiv.classList.remove('show');
      tooltipDiv.style.opacity = 0;
      return;
    }
    tooltipDiv.innerHTML = `
      <div class="owners-title">Owned by:</div>
      <div class="owners-list"></div>
    `;
    const listDiv = tooltipDiv.querySelector('.owners-list');
    if (ownerNames.length <= 3) {
      listDiv.innerHTML = ownerNames.join('<br>');
    } else {
      const scrollDiv = document.createElement('div');
      scrollDiv.className = "scrolling-names";
      scrollDiv.innerHTML = ownerNames.concat(ownerNames[0]).join("<br>");
      const duration = Math.max(7, ownerNames.length * 1.4);
      scrollDiv.style.animationDuration = duration + "s";
      listDiv.appendChild(scrollDiv);
    }
    // Force visible and opacity 0 for measurement
    tooltipDiv.style.display = 'block';
    tooltipDiv.style.opacity = 0;
    tooltipDiv.classList.add('show');

    // Use RAF for next paint, so offsetHeight/offsetWidth is correct
    requestAnimationFrame(() => {
      const rect = target.getBoundingClientRect();
      const scrollY = window.scrollY || window.pageYOffset;
      const scrollX = window.scrollX || window.pageXOffset;

      const tooltipRect = tooltipDiv.getBoundingClientRect();
      let left, top;
      // If mouseEvent available (mousemove), use its position
      if (mouseEvent) {
        left = mouseEvent.clientX + scrollX - tooltipRect.width/2;
        top = mouseEvent.clientY + scrollY - tooltipRect.height - 12;
        // If above top, flip below
        if (top < scrollY) top = mouseEvent.clientY + scrollY + 24;
      } else {
        // Default: center above card
        left = rect.left + scrollX + rect.width/2 - tooltipRect.width/2;
        top = rect.top + scrollY - tooltipRect.height - 14;
        if (top < scrollY) top = rect.bottom + scrollY + 14;
      }
      // Clamp to window
      left = clamp(left, 4, window.innerWidth - tooltipRect.width - 4);
      top = clamp(top, scrollY + 2, scrollY + window.innerHeight - tooltipRect.height - 4);

      tooltipDiv.style.left = `${left}px`;
      tooltipDiv.style.top = `${top}px`;
      tooltipDiv.style.opacity = 1;
    });
  }

  function hideOwnerTooltip() {
    tooltipDiv.classList.remove('show');
    tooltipDiv.style.opacity = 0;
  }

  document.querySelectorAll('.dex-grid .unified-card').forEach(card => {
    card.onmouseenter = function (e) {
      showOwnerTooltip(card, card._owners || [], e);
    };
    card.onmouseleave = hideOwnerTooltip;
    card.onmousedown = hideOwnerTooltip;
    card.ontouchstart = hideOwnerTooltip;
    card.onmousemove = function (e) {
      if (!tooltipDiv.classList.contains('show')) return;
      showOwnerTooltip(card, card._owners || [], e);
    };
  });

  window.addEventListener('scroll', hideOwnerTooltip, { passive: true });
}

// --- MAIN ENTRY ---
export function setupShinyDexHitlistSearch(shinyDex, teamShowcase) {
  // Pull points/family info from global scope if available
  const POKEMON_POINTS = window.POKEMON_POINTS || {};
  const pokemonFamilies = window.pokemonFamilies || {};

  const flattened = flattenDexData(shinyDex);

  const controls = document.createElement('div');
  controls.className = 'search-controls';

  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.placeholder = 'Search';
  searchInput.style.marginRight = '1.1em';
  controls.appendChild(searchInput);

  const tabDiv = document.createElement('div');
  tabDiv.style.display = 'flex';
  tabDiv.style.gap = '1.5em';
  tabDiv.style.alignItems = 'center';

  const hitlistTab = document.createElement('button');
  hitlistTab.textContent = "Shiny Dex Hitlist";
  hitlistTab.className = 'dex-tab active';
  hitlistTab.type = "button";
  tabDiv.appendChild(hitlistTab);

  const livingTab = document.createElement('button');
  livingTab.textContent = "Shiny Living Dex";
  livingTab.className = 'dex-tab';
  livingTab.type = "button";
  tabDiv.appendChild(livingTab);

  controls.appendChild(tabDiv);

  const hitlistSelect = document.createElement('select');
  hitlistSelect.style.marginLeft = '1.5em';
  [
    ["Standard", "standard"],
    ["Total Claims", "claims"],
    ["Total Claim Points", "points"]
  ].forEach(([labelText, value]) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = labelText;
    hitlistSelect.appendChild(option);
  });

  const livingSelect = document.createElement('select');
  livingSelect.style.marginLeft = '1.5em';
  [
    ["Standard", "standard"],
    ["Total Shinies", "totals"]
  ].forEach(([labelText, value]) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = labelText;
    livingSelect.appendChild(option);
  });
  livingSelect.style.display = "none";

  controls.appendChild(hitlistSelect);
  controls.appendChild(livingSelect);

  const resultCount = document.createElement('span');
  resultCount.style.marginLeft = "1.5em";
  controls.appendChild(resultCount);

  const container = document.getElementById('shiny-dex-container');
  if (!container) return;
  if (container.previousElementSibling && container.previousElementSibling.classList.contains('search-controls')) {
    container.previousElementSibling.remove();
  }
  container.parentNode.insertBefore(controls, container);

  let mode = "hitlist";
  let hitlistMode = "standard";
  let livingMode = "standard";
  let searchValue = '';

  function render() {
    resultCount.textContent = "";
    hitlistSelect.style.display = (mode === "hitlist") ? "" : "none";
    livingSelect.style.display = (mode === "living") ? "" : "none";

    // Visually indicate active mode tab and ARIA (for accessibility)
    if (mode === "hitlist") {
      hitlistTab.classList.add("active");
      livingTab.classList.remove("active");
      hitlistTab.setAttribute("aria-current", "page");
      livingTab.removeAttribute("aria-current");
    } else {
      hitlistTab.classList.remove("active");
      livingTab.classList.add("active");
      livingTab.setAttribute("aria-current", "page");
      hitlistTab.removeAttribute("aria-current");
    }

    const filter = searchValue.trim().toLowerCase();
    let nShown = 0;
    if (mode === "hitlist") {
      if (hitlistMode === "standard") {
        nShown = renderShinyDexFiltered(shinyDex, filter, pokemonFamilies, POKEMON_POINTS);
      } else if (hitlistMode === "claims") {
        nShown = renderScoreboardFiltered(flattened, filter, false, POKEMON_POINTS, pokemonFamilies);
      } else if (hitlistMode === "points") {
        nShown = renderScoreboardFiltered(flattened, filter, true, POKEMON_POINTS, pokemonFamilies);
      }
      if (typeof nShown === "number") {
        resultCount.textContent = `${nShown} Pokémon`;
      }
    } else if (mode === "living") {
      nShown = renderLivingDexFiltered(shinyDex, teamShowcase, filter, livingMode, pokemonFamilies, POKEMON_POINTS);
      if (typeof nShown === "number") {
        resultCount.textContent = `${nShown} Pokémon`;
      }
    }
  }

  hitlistTab.onclick = () => {
    mode = "hitlist";
    render();
  };
  livingTab.onclick = () => {
    mode = "living";
    render();
  };

  hitlistSelect.onchange = () => {
    hitlistMode = hitlistSelect.value;
    render();
  };
  livingSelect.onchange = () => {
    livingMode = livingSelect.value;
    render();
  };

  searchInput.addEventListener('input', e => {
    searchValue = e.target.value;
    render();
  });

  render();
}
