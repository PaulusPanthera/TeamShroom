// === Search Controls & Navigation for Shiny Dex Pokedex (Region/Scoreboard/Living Dex) ===

(function(){
  // --- Helper: Flatten all entries with region info for easy searching ---
  function flattenDexData(shinyDex) {
    const result = [];
    Object.entries(shinyDex).forEach(([region, entries]) => {
      entries.forEach(entry => result.push({...entry, region}));
    });
    return result;
  }

  // --- Helper: Map of member -> [pokemon, ...] claimed ---
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

  // --- Helper: Living Shiny Dex counts ---
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

  // --- Living Dex rendering (just like region grid, but shows count badge) ---
  function renderLivingDex(shinyDex, teamShowcase, filterRegions = null, filterNames = null) {
    const container = document.getElementById('shiny-dex-container');
    if (!container) return;
    container.innerHTML = '';
    const counts = buildLivingDexCounts(teamShowcase);

    Object.keys(shinyDex).forEach(region => {
      if (filterRegions && !filterRegions.includes(region)) return;
      const regionDiv = document.createElement('div');
      regionDiv.className = 'region-section';
      regionDiv.innerHTML = `<h2>${region}</h2>`;

      const grid = document.createElement('div');
      grid.className = 'dex-grid';

      shinyDex[region].forEach(entry => {
        if (filterNames && !filterNames.includes(entry.name.toLowerCase())) return;
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

  // --- Helper: Render scoreboard leaderboard (with .dex-entry grid style) ---
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

    // Filter by member name (case-insensitive, partial)
    if (memberFilter.trim()) {
      const search = memberFilter.trim().toLowerCase();
      members = members.filter(m => m.member.toLowerCase().includes(search));
    }

    // Sort by claim count descending, then alpha
    members.sort((a, b) => {
      if (b.pokes.length !== a.pokes.length) return b.pokes.length - a.pokes.length;
      return a.member.localeCompare(b.member);
    });

    // If filtering by "unclaimed", there are no members with 0 claims, so show "No members found."
    if (claimFilter === "unclaimed") {
      container.innerHTML = `<div style="color:#e0e0e0;font-size:1.2em;">No members found.</div>`;
      return;
    }

    // Build the leaderboard
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

    // If none found
    if (members.length === 0) {
      container.innerHTML = `<div style="color:#e0e0e0;font-size:1.2em;">No members found.</div>`;
    }
  }

  // --- Main search setup, called after the hitlist is rendered ---
  // Accepts shinyDex, teamShowcase (for Living Dex)
  window.setupShinyDexHitlistSearch = function(shinyDex, teamShowcase) {
    const flattened = flattenDexData(shinyDex);

    // --- Create UI controls ---
    const controls = document.createElement('div');
    controls.className = 'search-controls';

    // Search input (left)
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Search';
    controls.appendChild(searchInput);

    // Toggle (Shiny Dex Hitlist / Scoreboard / Living Shiny Dex)
    const toggleDiv = document.createElement('div');
    toggleDiv.style.display = 'flex';
    toggleDiv.style.gap = '0.8em';
    [
      ["Shiny Dex Hitlist", "region"],
      ["Scoreboard", "scoreboard"],
      ["Living Shiny Dex", "livingdex"]
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

    // Results count (right)
    const resultCount = document.createElement('span');
    controls.appendChild(resultCount);

    // Insert controls before the #shiny-dex-container
    const container = document.getElementById('shiny-dex-container');
    if (!container) return;
    container.parentNode.insertBefore(controls, container);

    // --- State ---
    let viewMode = 'region'; // region | scoreboard | livingdex
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

        // Handle "claimed" and "unclaimed" keywords
        if (claimFilter === "claimed") {
          filtered = filtered.filter(e => typeof e.claimed === 'string' && e.claimed);
        } else if (claimFilter === "unclaimed") {
          filtered = filtered.filter(e => !e.claimed);
        }

        // Further filter by name/member (but ignore "claimed"/"unclaimed" in search)
        let realSearch = input.replace(/claimed|unclaimed/g, '').trim();
        if (realSearch) {
          filtered = filtered.filter(e =>
            e.name.toLowerCase().includes(realSearch) ||
            (typeof e.claimed === 'string' && e.claimed.toLowerCase().includes(realSearch))
          );
        }

        // Group by region
        const grouped = {};
        filtered.forEach(e => {
          if (!grouped[e.region]) grouped[e.region] = [];
          grouped[e.region].push({...e});
        });
        renderShinyDex(grouped);
        resultCount.textContent = `${filtered.length} result${filtered.length === 1 ? '' : 's'}`;
      } else if (viewMode === 'scoreboard') {
        // Scoreboard view
        // Only "claimed" and "all" make sense in scoreboard
        let filter = searchValue.trim();
        // Remove claimed/unclaimed for member search
        let memberSearch = filter.replace(/claimed|unclaimed/gi, '').trim();
        renderScoreboard(flattened, memberSearch, claimFilter);
        // Count number of members matching filter
        const memberMap = getMemberClaims(flattened);
        const filteredNames = Object.keys(memberMap).filter(m => m.toLowerCase().includes(memberSearch.toLowerCase()));
        resultCount.textContent = `${claimFilter === 'unclaimed' ? 0 : filteredNames.length} member${filteredNames.length === 1 ? '' : 's'}`;
      } else if (viewMode === 'livingdex') {
        // Living Shiny Dex
        const input = searchValue.trim().toLowerCase();
        let filteredRegions = null;
        let filteredNames = null;
        if (input) {
          const allNames = [];
          Object.values(shinyDex).forEach(list => list.forEach(e => allNames.push(e.name)));
          filteredNames = allNames.filter(n => n.toLowerCase().includes(input));
        }
        renderLivingDex(shinyDex, teamShowcase, filteredRegions, filteredNames);
        // For result count, count how many entries matched filter
        let count = 0;
        Object.values(shinyDex).forEach(list => {
          list.forEach(e => {
            if (!filteredNames || filteredNames.includes(e.name.toLowerCase())) count++;
          });
        });
        resultCount.textContent = `${count} result${count === 1 ? '' : 's'}`;
      }
    }

    // --- Event listeners ---
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

    // --- Initial render ---
    updateResults();
  };
})();
