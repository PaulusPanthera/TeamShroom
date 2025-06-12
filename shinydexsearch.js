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

  // --- Helper: Render scoreboard leaderboard ---
  function renderScoreboard(flattened, memberFilter = "") {
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

    // Build the leaderboard
    members.forEach(({ member, pokes }, idx) => {
      const section = document.createElement('section');
      section.className = 'scoreboard-member-section';
      section.style.marginBottom = "2em";
      section.innerHTML = `<h2 style="color:#00fff7;letter-spacing:1.2px;margin-bottom:0.6em;">
        #${idx+1} ${member} <span style="font-size:0.7em;font-weight:normal;color:#e0e0e0;">(${pokes.length} claim${pokes.length!==1?'s':''})</span>
      </h2>
      <div class="scoreboard-member-claims" style="display:flex;flex-wrap:wrap;gap:10px 15px;"></div>
      `;
      const claimsDiv = section.querySelector('.scoreboard-member-claims');
      pokes.sort((a, b) => a.name.localeCompare(b.name));
      pokes.forEach(entry => {
        const div = document.createElement('div');
        div.className = 'scoreboard-claim-entry';
        div.style.display = "flex";
        div.style.flexDirection = "column";
        div.style.alignItems = "center";
        div.style.maxWidth = "90px";
        div.innerHTML = `
          <img src="${getPokemonGif(entry.name)}" alt="${entry.name}" style="width:64px;height:64px;image-rendering:pixelated;margin-bottom:0.2em;background:#23243b;border-radius:4px;">
          <div style="font-size:0.85em;text-align:center;">${entry.name}</div>
        `;
        claimsDiv.appendChild(div);
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

    // Search input
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Search';
    controls.appendChild(searchInput);

    // Results count (for scoreboard)
    const resultCount = document.createElement('span');
    controls.appendChild(resultCount);

    // Insert controls before the #shiny-dex-container
    const container = document.getElementById('shiny-dex-container');
    if (!container) return;
    container.parentNode.insertBefore(controls, container);

    // --- State ---
    let viewMode = 'region'; // region | scoreboard
    let searchValue = '';

    function updateResults() {
      if (viewMode === 'region') {
        // Filter as in old version
        const input = searchValue.trim().toLowerCase();
        let filtered = flattened;
        if (input) {
          filtered = filtered.filter(e =>
            e.name.toLowerCase().includes(input) ||
            (typeof e.claimed === 'string' && e.claimed.toLowerCase().includes(input))
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
        renderScoreboard(flattened, searchValue);
        // Count number of members matching filter
        const memberMap = getMemberClaims(flattened);
        const total = Object.keys(memberMap).filter(m => m.toLowerCase().includes(searchValue.trim().toLowerCase())).length;
        resultCount.textContent = `${total} member${total === 1 ? '' : 's'}`;
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
