// === Search Controls & Navigation for Shiny Dex Hitlist (Region/Scoreboard modes) ===
// Call this AFTER renderShinyDex(shinyDex) is called and #shiny-dex-container exists.

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
      section.innerHTML = `<h2 style="color:#00fff7;letter-spacing:1.2px;margin-bottom:0.6em;">
        #${idx+1} ${member} <span style="font-size:0.7em;font-weight:normal;color:#e0e0e0;">(${pokes.length} claim${pokes.length!==1?'s':''})</span>
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
  window.setupShinyDexHitlistSearch = function(shinyDex) {
    const flattened = flattenDexData(shinyDex);

    // --- Create UI controls ---
    const controls = document.createElement('div');
    controls.className = 'search-controls';

    // Search input (left)
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Search';
    controls.appendChild(searchInput);

    // Toggle (Region / Scoreboard)
    const toggleDiv = document.createElement('div');
    toggleDiv.style.display = 'flex';
    toggleDiv.style.gap = '0.8em';
    [
      ["Region", "region"],
      ["Scoreboard", "scoreboard"]
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
    let viewMode = 'region'; // region | scoreboard
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
