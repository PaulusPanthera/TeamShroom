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

  function buildLivingDexCounts(teamShowcase) {
    const counts = {};
    teamShowcase.forEach(member => {
      if (!member.shinies) return;
      member.shinies.forEach(shiny => {
        if (shiny.lost) return;
        let name = (shiny.name || "").trim().toLowerCase().replace(/[\s.'’♀♂-]/g, "");
        counts[name] = (counts[name] || 0) + 1;
      });
    });
    return counts;
  }
  function normalizeDexName(name) {
    return name.toLowerCase().replace(/[\s.'’♀♂-]/g, "");
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
    const container = document.getElementById('shiny-dex-container');
    if (!container) return;
    container.innerHTML = '';

    const memberMap = getMemberClaims(flattened);
    let members = Object.entries(memberMap)
      .map(([member, pokes]) => ({
        member,
        pokes
      }));

    if (memberFilter.trim()) {
      const search = memberFilter.trim().toLowerCase();
      members = members.filter(m => m.member.toLowerCase().includes(search));
    }

    members.sort((a, b) => {
      if (b.pokes.length !== a.pokes.length) return b.pokes.length - a.pokes.length;
      return a.member.localeCompare(b.member);
    });

    if (claimFilter === "unclaimed") {
      container.innerHTML = `<div style="color:#e0e0e0;font-size:1.2em;">No members found.</div>`;
      return;
    }

    members.forEach(({ member, pokes }, idx) => {
      const section = document.createElement('section');
      section.className = 'scoreboard-member-section';
      section.style.marginBottom = "2em";
      section.innerHTML = `<h2 style="color:var(--accent);letter-spacing:1.2px;margin-bottom:0.6em;">
        #${idx+1} ${member} <span style="font-size:0.7em;font-weight:normal;color:var(--text-main);">(${pokes.length} claim${pokes.length!==1?'s':''})</span>
      </h2>
      <div class="dex-grid"></div>
      `;
      const grid = section.querySelector('.dex-grid');
      pokes.sort((a, b) => a.name.localeCompare(b.name));
      pokes.forEach(entry => {
        const div = document.createElement('div');
        div.className = 'dex-entry claimed';
        div.innerHTML = `
          <img src="${getPokemonGif(entry.name)}" alt="${entry.name}" class="pokemon-gif" />
          <div class="dex-name">${entry.name}</div>
          <div class="dex-claimed">${entry.claimed}</div>
        `;
        grid.appendChild(div);
      });
      container.appendChild(section);
    });

    if (members.length === 0) {
      container.innerHTML = `<div style="color:#e0e0e0;font-size:1.2em;">No members found.</div>`;
    }
  }

  window.setupShinyDexHitlistSearch = function(shinyDex, teamShowcase) {
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

    function getFamilyForName(search, shinyDex) {
      // Return array of all names in the same family as the first match for `search`
      search = search.toLowerCase();
      for (let region in shinyDex) {
        let arr = shinyDex[region];
        for (let i = 0; i < arr.length; ++i) {
          if (arr[i].name.toLowerCase().includes(search)) {
            // walk family (previous and next with similar roots)
            // Find the span of family: look for continuous block sharing a root.
            // We assume families are grouped together in the region array.

            // Find family start
            let start = i;
            while (start > 0 && arr[start-1].name.split(/[ -]/)[0].toLowerCase() === arr[i].name.split(/[ -]/)[0].toLowerCase()) start--;

            // Find family end
            let end = i;
            while (end < arr.length-1 && arr[end+1].name.split(/[ -]/)[0].toLowerCase() === arr[i].name.split(/[ -]/)[0].toLowerCase()) end++;

            // Gather names (all in this family block)
            return arr.slice(start, end+1).map(e => e.name.toLowerCase());
          }
        }
      }
      return [];
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
        if (realSearch) {
          filtered = filtered.filter(e =>
            e.name.toLowerCase().includes(realSearch) ||
            (typeof e.claimed === 'string' && e.claimed.toLowerCase().includes(realSearch))
          );
        }
        const grouped = {};
        filtered.forEach(e => {
          if (!grouped[e.region]) grouped[e.region] = [];
          grouped[e.region].push({...e});
        });
        renderShinyDex(grouped);
        resultCount.textContent = `${filtered.length} result${filtered.length === 1 ? '' : 's'}`;
      } else if (viewMode === 'scoreboard') {
        let filter = searchValue.trim();
        let memberSearch = filter.replace(/claimed|unclaimed/gi, '').trim();
        renderScoreboard(flattened, memberSearch, claimFilter);
        const memberMap = getMemberClaims(flattened);
        const filteredNames = Object.keys(memberMap).filter(m => m.toLowerCase().includes(memberSearch.toLowerCase()));
        resultCount.textContent = `${claimFilter === 'unclaimed' ? 0 : filteredNames.length} member${filteredNames.length === 1 ? '' : 's'}`;
      } else if (viewMode === 'livingdex') {
        // --- FIXED Shiny Living Dex search with + for family ---
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
            // Find all names in the family
            let names = getFamilyForName(search, shinyDex);
            filteredEntries = entries.filter(e =>
              names.includes(e.name.toLowerCase())
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
        resultCount.textContent = `${count} result${count === 1 ? '' : 's'}`;
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
