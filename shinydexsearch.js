// === Search Controls & Navigation for Shiny Dex Pokedex with Tabs and Dropdowns ===

(function() {

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

  // Unified card renderer (same as in shinydex.js)
  function renderUnifiedCard(opts) {
    // opts: { name, img, info, lost, unclaimed }
    return `
      <div class="unified-card${opts.lost ? ' lost' : ''}${opts.unclaimed ? ' unclaimed' : ''}">
        <div class="unified-name">${opts.name}</div>
        <img src="${opts.img}" alt="${opts.name}" class="unified-img"${opts.lost ? ' style="opacity:0.6;filter:grayscale(1);"' : ""}>
        <div class="unified-info${opts.lost ? ' lost' : ''}">${opts.info}</div>
      </div>
    `;
  }

  // Helper for Pokémon gif
  function getPokemonGif(name) {
    if (name === "Mr. Mime") return "https://img.pokemondb.net/sprites/black-white/anim/shiny/mr-mime.gif";
    if (name === "Mime Jr.") return "https://img.pokemondb.net/sprites/black-white/anim/shiny/mime-jr.gif";
    if (name === "Nidoran♀") return "https://img.pokemondb.net/sprites/black-white/anim/shiny/nidoran-f.gif";
    if (name === "Nidoran♂") return "https://img.pokemondb.net/sprites/black-white/anim/shiny/nidoran-m.gif";

    let urlName = name
      .toLowerCase()
      .replace(/\u2640/g, "f")
      .replace(/\u2642/g, "m")
      .replace(/[\s.'’]/g, "");

    return `https://img.pokemondb.net/sprites/black-white/anim/shiny/${urlName}.gif`;
  }

  // --- Renders ---

 function renderShinyDex(regions) {
  const container = document.getElementById('shiny-dex-container');
  if (!container) return;
  container.innerHTML = '';
  Object.keys(regions).forEach(region => {
    const regionDiv = document.createElement('div');
    regionDiv.className = 'region-section';
    regionDiv.innerHTML = `<h2>${region}</h2>`;

    const grid = document.createElement('div');
    grid.className = 'dex-grid';

    regions[region].forEach(entry => {
      // Show only the member name if claimed, or "Unclaimed" if not
      let info = entry.claimed ? entry.claimed : "Unclaimed";
      grid.innerHTML += renderUnifiedCard({
        name: entry.name,
        img: getPokemonGif(entry.name),
        info,
        unclaimed: !entry.claimed
      });
    });
    regionDiv.appendChild(grid);
    container.appendChild(regionDiv);
  });
}

  function renderScoreboard(flattened, sortByPoints = false) {
    if (!window.POKEMON_POINTS && window.buildPokemonPoints) window.buildPokemonPoints();

    const container = document.getElementById('shiny-dex-container');
    if (!container) return;
    container.innerHTML = '';

    const memberMap = getMemberClaims(flattened);
    let allMembers = Object.entries(memberMap)
      .map(([member, pokes]) => ({
        member,
        pokes,
        points: pokes.reduce((sum, entry) => sum + getPointsForPokemon(entry.name), 0)
      }));

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

    allMembers.forEach(({ member, pokes, points }, idx) => {
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
          info: `${p} Points`
        });
      });
      container.appendChild(section);
    });

    if (allMembers.length === 0) {
      container.innerHTML = `<div style="color:#e0e0e0;font-size:1.2em;">No members found.</div>`;
    }
  }

  function renderLivingDex(shinyDex, teamShowcase, sortMode = "standard") {
    const container = document.getElementById('shiny-dex-container');
    if (!container) return;
    container.innerHTML = '';
    const counts = buildLivingDexCounts(teamShowcase);

    // Collate all entries into a flat array for sorting if needed
    let allEntries = [];
    Object.keys(shinyDex).forEach(region => {
      shinyDex[region].forEach(entry => {
        allEntries.push({ ...entry, region, count: counts[normalizeDexName(entry.name)] || 0 });
      });
    });

    if (sortMode === "totals") {
      // Sort Pokemon by count (descending), then alpha
      allEntries.sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return a.name.localeCompare(b.name);
      });

      // Make a single region called "Most Shinies"
      const regionDiv = document.createElement('div');
      regionDiv.className = 'region-section';
      regionDiv.innerHTML = `<h2>Pokémon with Most Living Shinies</h2>`;
      const grid = document.createElement('div');
      grid.className = 'dex-grid';
      allEntries.forEach(entry => {
        grid.innerHTML += renderUnifiedCard({
          name: entry.name,
          img: getPokemonGif(entry.name),
          info: entry.count > 0 ? `<span class="livingdex-count">${entry.count}</span>` : "0"
        });
      });
      regionDiv.appendChild(grid);
      container.appendChild(regionDiv);
    } else {
      // Standard region view
      Object.keys(shinyDex).forEach(region => {
        const regionDiv = document.createElement('div');
        regionDiv.className = 'region-section';
        regionDiv.innerHTML = `<h2>${region}</h2>`;

        const grid = document.createElement('div');
        grid.className = 'dex-grid';

        shinyDex[region].forEach(entry => {
          const nName = normalizeDexName(entry.name);
          const count = counts[nName] || 0;
          grid.innerHTML += renderUnifiedCard({
            name: entry.name,
            img: getPokemonGif(entry.name),
            info: count > 0 ? `<span class="livingdex-count">${count}</span>` : "0"
          });
        });

        regionDiv.appendChild(grid);
        container.appendChild(regionDiv);
      });
    }
  }

  // MAIN ENTRY
  window.setupShinyDexHitlistSearch = function(shinyDex, teamShowcase) {
    // Ensure points are built
    if (window.buildPokemonPoints) window.buildPokemonPoints();
    const flattened = flattenDexData(shinyDex);

    // --- Tabs for switching between Hitlist and Living Dex ---
    const controls = document.createElement('div');
    controls.className = 'search-controls';

    // Tabs
    const tabDiv = document.createElement('div');
    tabDiv.style.display = 'flex';
    tabDiv.style.gap = '1.5em';
    tabDiv.style.marginRight = '2em';
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

    // --- Dropdowns for each mode ---
    // Hitlist dropdown
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

    // Living Dex dropdown
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
    livingSelect.style.display = "none"; // hidden by default

    controls.appendChild(hitlistSelect);
    controls.appendChild(livingSelect);

    // Result count (optional, can be improved)
    const resultCount = document.createElement('span');
    controls.appendChild(resultCount);

    // Insert controls
    const container = document.getElementById('shiny-dex-container');
    if (!container) return;
    if (container.previousElementSibling && container.previousElementSibling.classList.contains('search-controls')) {
      container.previousElementSibling.remove();
    }
    container.parentNode.insertBefore(controls, container);

    // --- State ---
    let mode = "hitlist"; // or "living"
    let hitlistMode = "standard"; // "standard", "claims", "points"
    let livingMode = "standard"; // "standard", "totals"

    // --- Render function ---
    function render() {
      resultCount.textContent = "";
      if (mode === "hitlist") {
        hitlistSelect.style.display = "";
        livingSelect.style.display = "none";
        if (hitlistMode === "standard") {
          renderShinyDex(shinyDex);
        } else if (hitlistMode === "claims") {
          renderScoreboard(flattened, false);
        } else if (hitlistMode === "points") {
          renderScoreboard(flattened, true);
        }
      } else if (mode === "living") {
        hitlistSelect.style.display = "none";
        livingSelect.style.display = "";
        renderLivingDex(shinyDex, teamShowcase, livingMode);
      }
    }

    // --- Tab event handlers ---
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

    // Dropdown change events
    hitlistSelect.onchange = () => {
      hitlistMode = hitlistSelect.value;
      render();
    };
    livingSelect.onchange = () => {
      livingMode = livingSelect.value;
      render();
    };

    // Initial render
    render();
  };
})();
