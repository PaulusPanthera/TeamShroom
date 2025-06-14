// === Search Controls & Navigation for Shiny Dex Pokedex (Region/Scoreboard/Shiny Living Dex) ===

(function(){
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

  function renderLivingDex(shinyDex, teamShowcase, filterRegions = null, filterNames = null, searchTerm = '') {
    const container = document.getElementById('shiny-dex-container');
    if (!container) return;
    container.innerHTML = '';
    const counts = buildLivingDexCounts(teamShowcase);

    Object.keys(shinyDex).forEach(region => {
      if (filterRegions && !filterRegions.includes(region)) return;
      const filteredEntries = shinyDex[region];
      if (!filteredEntries || filteredEntries.length === 0) return;
      const regionDiv = document.createElement('div');
      regionDiv.className = 'region-section';
      regionDiv.innerHTML = `<h2>${region}</h2>`;

      const grid = document.createElement('div');
      grid.className = 'dex-grid';

      filteredEntries.forEach(entry => {
        const nName = normalizeDexName(entry.name);
        const count = counts[nName] || 0;
        const div = document.createElement('div');
        div.className = 'dex-entry' + (count > 0 ? ' claimed' : ' unclaimed');
        div.innerHTML = `
          <img src="${getPokemonGif(entry.name)}" alt="${entry.name}" class="pokemon-gif" />
          <div class="dex-name">${entry.name}</div>
          <div class="dex-claimed">${count > 0 ? `<span class="livingdex-count">${count}</span>` : "0"}</div>
        `;
        grid.appendChild(div);
      });

      regionDiv.appendChild(grid);
      container.appendChild(regionDiv);
    });
  }

  function renderScoreboard(flattened, memberFilter = "", claimFilter = "all") {
    // Build points after everything is loaded, if not present
    if (!window.POKEMON_POINTS && window.buildPokemonPoints) window.buildPokemonPoints();

    const container = document.getElementById('shiny-dex-container');
    if (!container) return;
    container.innerHTML = '';

    const memberMap = getMemberClaims(flattened);

    // Build full member list with points and assign rank
    let allMembers = Object.entries(memberMap)
      .map(([member, pokes]) => ({
        member,
        pokes,
        points: pokes.reduce((sum, entry) => sum + getPointsForPokemon(entry.name), 0)
      }));

    allMembers.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.pokes.length !== a.pokes.length) return b.pokes.length - a.pokes.length;
      return a.member.localeCompare(b.member);
    });

    // Assign rank to each member (1-based)
    const memberRank = {};
    allMembers.forEach((m, idx) => {
      memberRank[m.member] = idx + 1;
    });

    // Filtering for search
    let members = allMembers;
    if (memberFilter.trim()) {
      const search = memberFilter.trim().toLowerCase();
      members = members.filter(m => m.member.toLowerCase().includes(search));
    }

    if (claimFilter === "unclaimed") {
      container.innerHTML = `<div style="color:#e0e0e0;font-size:1.2em;">No members found.</div>`;
      return;
    }

    members.forEach(({ member, pokes, points }) => {
      const section = document.createElement('section');
      section.className = 'scoreboard-member-section';
      section.style.marginBottom = "2em";
      section.innerHTML = `<h2>
#${memberRank[member]} ${member} <span style="font-size:0.7em;font-weight:normal;color:var(--text-main);">(${pokes.length} Claims ${points} Points)</span>
</h2>
<div class="dex-grid"></div>
      `;
      const grid = section.querySelector('.dex-grid');
      pokes.sort((a, b) => a.name.localeCompare(b.name));
      pokes.forEach(entry => {
        const p = getPointsForPokemon(entry.name);
        const div = document.createElement('div');
        div.className = 'dex-entry claimed';
        div.innerHTML = `
          <img src="${getPokemonGif(entry.name)}" alt="${entry.name}" class="pokemon-gif" />
          <div class="dex-name">${entry.name}</div>
          <div class="dex-claimed">${p} Points</div>
        `;
        grid.appendChild(div);
      });
      container.appendChild(section);
    });

    if (members.length === 0) {
      container.innerHTML = `<div style="color:#e0e0e0;font-size:1.2em;">No members found.</div>`;
    }
  }

  function getFamilyForName(search) {
    search = search.toLowerCase().trim();
    if (typeof window.pokemonFamilies === 'object') {
      if (pokemonFamilies[search]) return pokemonFamilies[search];
      for (const key in pokemonFamilies) {
        if (key.startsWith(search)) return pokemonFamilies[key];
      }
      for (const key in pokemonFamilies) {
        if (key.includes(search)) return pokemonFamilies[key];
      }
      return [search];
    }
    return [search];
  }

  function norm(name) {
    return name
      .toLowerCase()
      .replace(/♀/g, "-f")
      .replace(/♂/g, "-m")
      .replace(/[\s.'’]/g, "");
  }

  window.setupShinyDexHitlistSearch = function(shinyDex, teamShowcase) {
    // Ensure points are built
    if (window.buildPokemonPoints) window.buildPokemonPoints();

    const flattened = flattenDexData(shinyDex);

    const controls = document.createElement('div');
    controls.className = 'search-controls';

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Search';
    controls.appendChild(searchInput);

    const toggleDiv = document.createElement('div');
    toggleDiv.style.display = 'flex';
    toggleDiv.style.gap = '0.8em';
    [
      ["Shiny Dex Hitlist", "region"],
      ["Scoreboard", "scoreboard"],
      ["Shiny Living Dex", "livingdex"]
    ].forEach(([labelText, value]) => {
      const label = document.createElement('label');
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'view-toggle';
      radio.value = value;
      if (value === 'region') radio.checked = true;
      label.appendChild(radio);
      label.appendChild(document.createTextNode(' ' + labelText));
      toggleDiv.appendChild(label);
    });
    controls.appendChild(toggleDiv);

    const resultCount = document.createElement('span');
    controls.appendChild(resultCount);

    const container = document.getElementById('shiny-dex-container');
    if (!container) return;
    container.parentNode.insertBefore(controls, container);

    let viewMode = 'region';
    let searchValue = '';

    function getClaimFilter(s) {
      const lower = s.toLowerCase();
      if (lower.includes("unclaimed")) return "unclaimed";
      if (lower.includes("claimed")) return "claimed";
      return "all";
    }

    function updateResults() {
      const claimFilter = getClaimFilter(searchValue);

      if (viewMode === 'region') {
        const input = searchValue.trim().toLowerCase();
        let filtered = flattened;
        if (claimFilter === "claimed") {
          filtered = filtered.filter(e => typeof e.claimed === 'string' && e.claimed);
        } else if (claimFilter === "unclaimed") {
          filtered = filtered.filter(e => !e.claimed);
        }
        let realSearch = input.replace(/claimed|unclaimed/g, '').trim();
        let showFamily = false;
        if (realSearch.endsWith('+')) {
          showFamily = true;
          realSearch = realSearch.slice(0, -1).trim();
        }
        if (realSearch) {
          if (showFamily) {
            const familyNames = getFamilyForName(realSearch).map(norm);
            filtered = filtered.filter(e =>
              familyNames.includes(norm(e.name))
            );
          } else {
            filtered = filtered.filter(e =>
              e.name.toLowerCase().includes(realSearch) ||
              (typeof e.claimed === 'string' && e.claimed.toLowerCase().includes(realSearch))
            );
          }
        }
        const grouped = {};
        filtered.forEach(e => {
          if (!grouped[e.region]) grouped[e.region] = [];
          grouped[e.region].push({...e});
        });
        renderShinyDex(grouped);
        resultCount.textContent = `${filtered.length} Results`;
      } else if (viewMode === 'scoreboard') {
        let filter = searchValue.trim();
        let memberSearch = filter.replace(/claimed|unclaimed/gi, '').trim();
        renderScoreboard(flattened, memberSearch, claimFilter);
        const memberMap = getMemberClaims(flattened);
        const filteredNames = Object.keys(memberMap).filter(m => m.toLowerCase().includes(memberSearch.toLowerCase()));
        resultCount.textContent = `${claimFilter === 'unclaimed' ? 0 : filteredNames.length} Member${filteredNames.length === 1 ? '' : 's'}`;
      } else if (viewMode === 'livingdex') {
        let search = searchValue.trim().toLowerCase();
        let showFamily = false;
        if (search.endsWith('+')) {
          showFamily = true;
          search = search.slice(0, -1).trim();
        }
        const filteredDex = {};
        let count = 0;
        Object.entries(shinyDex).forEach(([region, entries]) => {
          let filteredEntries;
          if (!search) {
            filteredEntries = entries;
          } else if (showFamily && search) {
            let familyNames = getFamilyForName(search).map(norm);
            filteredEntries = entries.filter(e =>
              familyNames.includes(norm(e.name))
            );
          } else {
            filteredEntries = entries.filter(e =>
              e.name.toLowerCase().includes(search) ||
              region.toLowerCase().includes(search)
            );
          }
          if (filteredEntries.length > 0) {
            filteredDex[region] = filteredEntries;
            count += filteredEntries.length;
          }
        });
        renderLivingDex(filteredDex, teamShowcase, null, null, searchValue);
        resultCount.textContent = `${count} Results`;
      }
    }

    searchInput.addEventListener('input', e => {
      searchValue = e.target.value;
      updateResults();
    });

    toggleDiv.querySelectorAll('input[type=radio]').forEach(radio => {
      radio.addEventListener('change', e => {
        viewMode = e.target.value;
        updateResults();
      });
    });

    updateResults();
  };
})();
