// === Search Controls & Navigation for Shiny Dex Pokedex with Tabs, Dropdowns, and Text/Family Search (with + prefix/suffix, search left, also in Living Dex, custom tooltip) ===

(function() {
  // --- Helper to prettify Pokémon names from lowercase or dash/underscore to display case ---
  function prettifyPokemonName(raw) {
    if (raw === "nidoran-f") return "Nidoran♀";
    if (raw === "nidoran-m") return "Nidoran♂";
    if (raw === "mr.mime") return "Mr. Mime";
    if (raw === "mime-jr") return "Mime Jr.";
    if (raw === "type-null") return "Type: Null";
    if (raw === "porygon-z") return "Porygon-Z";
    // Add more exceptions if needed.
    return raw
      .split(/[-_]/)
      .map(s => s.charAt(0).toUpperCase() + s.slice(1))
      .join(' ');
  }

  // --- BUILD SHINY DEX FROM JSON (FAMILIES) ---
  window.buildShinyDexFromFamilies = function() {
    // Group Pokémon by region
    const shinyDex = {};
    (window.pokemonFamiliesData || []).forEach(entry => {
      const region = entry.region || "Other";
      if (!shinyDex[region]) shinyDex[region] = [];
      shinyDex[region].push({
        name: prettifyPokemonName(entry.pokemon),
        claimed: entry.claimed
      });
    });
    window.shinyDex = shinyDex;
  };

  // Utilities
  function flattenDexData(shinyDex) {
    const result = [];
    Object.entries(shinyDex).forEach(([region, entries]) => {
      entries.forEach((entry, idx, arr) => {
        result.push({...entry, region, familyIndex: idx, familyArr: arr});
      });
    });
    return result;
  }

  function getMemberClaims(flattened) {
    const memberMap = {};
    flattened.forEach(e => {
      if (typeof e.claimed === 'string' && e.claimed) {
        if (!memberMap[e.claimed]) memberMap[e.claimed] = [];
        memberMap[e.claimed].push(e);
      }
    });
    return memberMap;
  }

  function normalizeDexName(name) {
    return (
      name
        .toLowerCase()
        .replace(/♀/g, "-f")
        .replace(/♂/g, "-m")
        .replace(/[\s.'’]/g, "")
    );
  }

  function buildLivingDexCounts(teamShowcase) {
    const counts = {};
    teamShowcase.forEach(member => {
      if (!member.shinies) return;
      member.shinies.forEach(shiny => {
        if (shiny.lost) return;
        let name = (shiny.name || "")
          .trim()
          .toLowerCase()
          .replace(/♀/g, "-f")
          .replace(/♂/g, "-m")
          .replace(/[\s.'’]/g, "");
        counts[name] = (counts[name] || 0) + 1;
      });
    });
    return counts;
  }

  function getPointsForPokemon(name) {
    if (!window.POKEMON_POINTS) return 1;
    let normName = name
      .toLowerCase()
      .replace(/♀/g, "-f")
      .replace(/♂/g, "-m")
      .replace(/[\s.'’]/g, "");
    return window.POKEMON_POINTS[normName] || 1;
  }

  // Helper for Pokémon gif
  function getPokemonGif(name) {
    // Use prettified name for exceptions
    if (name === "Mr. Mime") return "https://img.pokemondb.net/sprites/black-white/anim/shiny/mr-mime.gif";
    if (name === "Mime Jr.") return "https://img.pokemondb.net/sprites/black-white/anim/shiny/mime-jr.gif";
    if (name === "Nidoran♀") return "https://img.pokemondb.net/sprites/black-white/anim/shiny/nidoran-f.gif";
    if (name === "Nidoran♂") return "https://img.pokemondb.net/sprites/black-white/anim/shiny/nidoran-m.gif";
    if (name === "Type: Null") return "https://img.pokemondb.net/sprites/black-white/anim/shiny/type-null.gif";
    if (name === "Porygon-Z") return "https://img.pokemondb.net/sprites/black-white/anim/shiny/porygon-z.gif";

    let urlName = name
      .toLowerCase()
      .replace(/\u2640/g, "f")
      .replace(/\u2642/g, "m")
      .replace(/[\s.'’]/g, "");

    return `https://img.pokemondb.net/sprites/black-white/anim/shiny/${urlName}.gif`;
  }

  // --- FILTER LOGIC ---

  function filterEntry(entry, filter) {
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
      if (!window.pokemonFamilies) return false;
      let baseName = normalizeDexName(entry.name);
      let family = window.pokemonFamilies[baseName];
      if (!family) return false;
      return family.some(famName => famName.toLowerCase().includes(familySearch));
    }

    // Claimed/unclaimed text search
    if (filter === "claimed") return !!entry.claimed;
    if (filter === "unclaimed") return !entry.claimed;

    // --- Region search support ---
    const regionList = ["kanto", "johto", "hoenn", "sinnoh", "unova"];
    if (regionList.includes(filter)) {
      return (entry.region && entry.region.toLowerCase() === filter);
    }

    // Otherwise, match name or claimed string
    let nameMatch = entry.name.toLowerCase().includes(filter);
    let claimedMatch = entry.claimed && typeof entry.claimed === "string"
      ? entry.claimed.toLowerCase().includes(filter)
      : false;
    return nameMatch || claimedMatch;
  }

  // --- Renders ---

  function renderShinyDexFiltered(regions, filter) {
    const container = document.getElementById('shiny-dex-container');
    if (!container) return;
    container.innerHTML = '';
    let totalShown = 0;
    Object.keys(regions).forEach(region => {
      const filteredEntries = regions[region].filter(entry =>
        filterEntry(entry, filter)
      );
      if (!filteredEntries.length) return;
      totalShown += filteredEntries.length;
      const regionDiv = document.createElement('div');
      regionDiv.className = 'region-section';
      regionDiv.innerHTML = `<h2>${region}</h2>`;

      const grid = document.createElement('div');
      grid.className = 'dex-grid';

      filteredEntries.forEach(entry => {
        let info = entry.claimed ? entry.claimed : "Unclaimed";
        grid.innerHTML += renderUnifiedCard({
          name: entry.name,
          img: getPokemonGif(entry.name),
          info,
          unclaimed: !entry.claimed,
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

  function renderScoreboardFiltered(flattened, filter, sortByPoints = false) {
    if (!window.POKEMON_POINTS && window.buildPokemonPoints) window.buildPokemonPoints();

    const container = document.getElementById('shiny-dex-container');
    if (!container) return;
    container.innerHTML = '';

    const memberMap = getMemberClaims(flattened);
    let allMembers = Object.entries(memberMap)
      .map(([member, pokes]) => ({
        member,
        pokes: pokes.filter(entry => filterEntry(entry, filter)),
        points: pokes.reduce((sum, entry) => sum + getPointsForPokemon(entry.name), 0)
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
        const p = getPointsForPokemon(entry.name);
        grid.innerHTML += renderUnifiedCard({
          name: entry.name,
          img: getPokemonGif(entry.name),
          info: `${p} Points`,
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
  function renderLivingDexFiltered(shinyDex, teamShowcase, filter, sortMode = "standard") {
    const container = document.getElementById('shiny-dex-container');
    if (!container) return;
    container.innerHTML = '';
    const counts = buildLivingDexCounts(teamShowcase);

    function normalize(name) {
      return (name || "")
        .toLowerCase()
        .replace(/♀/g, "-f")
        .replace(/♂/g, "-m")
        .replace(/[\s.'’]/g, "");
    }

    function getOwners(entry) {
      const entryNorm = normalize(entry.name);
      let owners = [];
      for (const member of teamShowcase) {
        if (!Array.isArray(member.shinies)) continue;
        for (const shiny of member.shinies) {
          if (shiny.lost) continue;
          if (normalize(shiny.name) === entryNorm) {
            owners.push(member.name);
            break; // Only show each member once per mon
          }
        }
      }
      return owners;
    }

    function createCard(entry, count, owners) {
      const temp = document.createElement("div");
      temp.innerHTML = renderUnifiedCard({
        name: entry.name,
        img: getPokemonGif(entry.name),
        info: count > 0 ? `<span class="livingdex-count">${count}</span>` : "0",
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
          allEntries.push({ ...entry, region, count: counts[normalize(entry.name)] || 0 });
        });
      });
      allEntries.sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return a.name.localeCompare(b.name);
      });
      let filtered = allEntries.filter(entry => filterEntry(entry, filter));
      let totalShown = filtered.length;

      const regionDiv = document.createElement('div');
      regionDiv.className = 'region-section';
      regionDiv.innerHTML = `<h2>Pokémon with Most Living Shinies</h2>`;
      const grid = document.createElement('div');
      grid.className = 'dex-grid';
      filtered.forEach(entry => {
        let owners = getOwners(entry);
        let card = createCard(entry, entry.count, owners);
        grid.appendChild(card);
      });
      regionDiv.appendChild(grid);
      container.appendChild(regionDiv);
      setupLivingDexOwnerTooltips();
      return totalShown;
    } else {
      let totalShown = 0;
      Object.keys(shinyDex).forEach(region => {
        const filteredEntries = shinyDex[region].filter(entry => filterEntry(entry, filter));
        if (!filteredEntries.length) return;
        totalShown += filteredEntries.length;

        const regionDiv = document.createElement('div');
        regionDiv.className = 'region-section';
        regionDiv.innerHTML = `<h2>${region}</h2>`;

        const grid = document.createElement('div');
        grid.className = 'dex-grid';

        filteredEntries.forEach(entry => {
          let nName = normalize(entry.name);
          let count = counts[nName] || 0;
          let owners = getOwners(entry);
          let card = createCard(entry, count, owners);
          grid.appendChild(card);
        });

        regionDiv.appendChild(grid);
        container.appendChild(regionDiv);
      });
      setupLivingDexOwnerTooltips();
      return totalShown;
    }
  }

  // --- Custom tooltip logic for Living Dex ---
  function setupLivingDexOwnerTooltips() {
    let tooltipDiv = document.querySelector('.dex-owner-tooltip');
    if (!tooltipDiv) {
      tooltipDiv = document.createElement('div');
      tooltipDiv.className = 'dex-owner-tooltip';
      document.body.appendChild(tooltipDiv);
    }

    function showOwnerTooltip(target, ownerNames) {
      if (!ownerNames || !ownerNames.length) {
        tooltipDiv.classList.remove('show');
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

      tooltipDiv.classList.add('show');
      const rect = target.getBoundingClientRect();
      let top = rect.top + window.scrollY - tooltipDiv.offsetHeight - 14;
      let left = rect.left + window.scrollX + rect.width / 2 - tooltipDiv.offsetWidth / 2;
      if (top < window.scrollY) top = rect.bottom + window.scrollY + 14;
      if (left < 4) left = 4;
      if (left + tooltipDiv.offsetWidth > window.innerWidth - 4)
        left = window.innerWidth - tooltipDiv.offsetWidth - 4;
      tooltipDiv.style.top = `${top}px`;
      tooltipDiv.style.left = `${left}px`;
    }
    function hideOwnerTooltip() {
      tooltipDiv.classList.remove('show');
    }

    document.querySelectorAll('.dex-grid .unified-card').forEach(card => {
      card.onmouseenter = function (e) {
        showOwnerTooltip(card, card._owners || []);
      };
      card.onmouseleave = hideOwnerTooltip;
      card.onmousedown = hideOwnerTooltip;
      card.ontouchstart = hideOwnerTooltip;
      card.onmousemove = function (e) {
        if (!tooltipDiv.classList.contains('show')) return;
        const rect = card.getBoundingClientRect();
        let top = rect.top + window.scrollY - tooltipDiv.offsetHeight - 14;
        let left = rect.left + window.scrollX + rect.width / 2 - tooltipDiv.offsetWidth / 2;
        if (top < window.scrollY) top = rect.bottom + window.scrollY + 14;
        if (left < 4) left = 4;
        if (left + tooltipDiv.offsetWidth > window.innerWidth - 4)
          left = window.innerWidth - tooltipDiv.offsetWidth - 4;
        tooltipDiv.style.top = `${top}px`;
        tooltipDiv.style.left = `${left}px`;
      };
    });
  }

  // MAIN ENTRY
  window.setupShinyDexHitlistSearch = function(shinyDex, teamShowcase) {
    if (window.buildPokemonPoints) window.buildPokemonPoints();
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

      const filter = searchValue.trim().toLowerCase();
      let nShown = 0;
      if (mode === "hitlist") {
        if (hitlistMode === "standard") {
          nShown = renderShinyDexFiltered(shinyDex, filter);
        } else if (hitlistMode === "claims") {
          nShown = renderScoreboardFiltered(flattened, filter, false);
        } else if (hitlistMode === "points") {
          nShown = renderScoreboardFiltered(flattened, filter, true);
        }
        if (typeof nShown === "number") {
          resultCount.textContent = `${nShown} Pokémon`;
        }
      } else if (mode === "living") {
        nShown = renderLivingDexFiltered(shinyDex, teamShowcase, filter, livingMode);
        if (typeof nShown === "number") {
          resultCount.textContent = `${nShown} Pokémon`;
        }
      }
    }

    hitlistTab.onclick = () => {
      mode = "hitlist";
      hitlistTab.classList.add("active");
      livingTab.classList.remove("active");
      render();
    };
    livingTab.onclick = () => {
      mode = "living";
      hitlistTab.classList.remove("active");
      livingTab.classList.add("active");
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
  };
})();
