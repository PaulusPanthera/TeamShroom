// === Search Controls & Navigation for Shiny Dex Hitlist ===
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

  // --- Main search setup, called after the hitlist is rendered ---
  window.setupShinyDexHitlistSearch = function(shinyDex) {
    const flattened = flattenDexData(shinyDex);

    // --- Create UI controls ---
    const controls = document.createElement('div');
    controls.className = 'search-controls'; // Use CSS class for consistent styling

    // Search input
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Search';
    controls.appendChild(searchInput);

    // Toggle (All / Pokemon / Member)
    const toggleDiv = document.createElement('div');
    toggleDiv.style.display = 'flex';
    toggleDiv.style.gap = '0.4em';
    const toggleNames = [
      ["All", "all"],
      ["Pokemon", "pokemon"],
      ["Member", "member"]
    ];
    toggleNames.forEach(([labelText, value]) => {
      const label = document.createElement('label');
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'search-toggle';
      radio.value = value;
      if (value === 'all') radio.checked = true;
      label.appendChild(radio);
      label.appendChild(document.createTextNode(' ' + labelText));
      toggleDiv.appendChild(label);
    });
    controls.appendChild(toggleDiv);

    // Results count and navigation
    const navDiv = document.createElement('div');
    navDiv.style.display = 'flex';
    navDiv.style.alignItems = 'center';
    navDiv.style.gap = '0.4em';

    const upBtn = document.createElement('button');
    upBtn.textContent = '▲';

    const downBtn = document.createElement('button');
    downBtn.textContent = '▼';

    const resultCount = document.createElement('span');
    navDiv.append(upBtn, resultCount, downBtn);
    controls.appendChild(navDiv);

    // Insert controls before the #shiny-dex-container
    const container = document.getElementById('shiny-dex-container');
    if (!container) return;
    container.parentNode.insertBefore(controls, container);

    // --- Search/filter logic ---
    let filterMode = 'all'; // all | pokemon | member
    let searchValue = '';
    let matches = [];
    let activeMatchIdx = 0;

    function getFilteredDex() {
      const input = searchValue.trim().toLowerCase();
      let filtered = flattened;

      // Special case: Show all unclaimed if "unclaimed" is typed
      if (input === "unclaimed") {
        filtered = filtered.filter(e => !e.claimed);
        return filtered;
      }

      // Apply toggle filter
      if (filterMode === 'pokemon') {
        filtered = filtered.filter(e => e.name.toLowerCase().includes(input));
      } else if (filterMode === 'member') {
        filtered = filtered.filter(e => typeof e.claimed === 'string' && e.claimed.toLowerCase().includes(input));
      } else if (filterMode === 'all') {
        filtered = filtered.filter(e =>
          e.name.toLowerCase().includes(input) ||
          (typeof e.claimed === 'string' && e.claimed.toLowerCase().includes(input))
        );
      }
      return filtered;
    }

    function updateResults() {
      const filtered = getFilteredDex();
      matches = filtered;
      // For navigation: group by region and render in same format as original
      const grouped = {};
      matches.forEach(e => {
        if (!grouped[e.region]) grouped[e.region] = [];
        grouped[e.region].push({...e});
      });
      renderShinyDex(grouped);

      // Highlight the currently "active" match (if any)
      if (matches.length > 0) {
        const allEntries = container.querySelectorAll('.dex-entry');
        let count = 0;
        let found = false;
        for (let i = 0; i < allEntries.length; ++i) {
          if (count === activeMatchIdx && !found) {
            allEntries[i].style.boxShadow = '0 0 0 4px var(--accent, #5a72f7), 0 0 18px var(--accent, #5a72f7cc), 0 2px 8px #000a';
            allEntries[i].style.zIndex = 10;
            allEntries[i].scrollIntoView({ block: 'center', behavior: 'smooth' });
            found = true;
          } else {
            allEntries[i].style.boxShadow = '';
            allEntries[i].style.zIndex = '';
          }
          count++;
        }
      }

      // Update navigation
      if (matches.length > 0) {
        resultCount.textContent = `${activeMatchIdx + 1} / ${matches.length}`;
        upBtn.disabled = activeMatchIdx === 0;
        downBtn.disabled = activeMatchIdx === matches.length - 1;
        upBtn.style.opacity = upBtn.disabled ? 0.5 : 1;
        downBtn.style.opacity = downBtn.disabled ? 0.5 : 1;
      } else {
        resultCount.textContent = '0 results';
        upBtn.disabled = true;
        downBtn.disabled = true;
        upBtn.style.opacity = 0.5;
        downBtn.style.opacity = 0.5;
      }
    }

    // --- Event listeners ---
    searchInput.addEventListener('input', e => {
      searchValue = e.target.value;
      activeMatchIdx = 0;
      updateResults();
    });

    toggleDiv.querySelectorAll('input[type=radio]').forEach(radio => {
      radio.addEventListener('change', e => {
        filterMode = e.target.value;
        activeMatchIdx = 0;
        updateResults();
      });
    });

    upBtn.addEventListener('click', () => {
      if (activeMatchIdx > 0) {
        activeMatchIdx--;
        updateResults();
      }
    });
    downBtn.addEventListener('click', () => {
      if (activeMatchIdx < matches.length - 1) {
        activeMatchIdx++;
        updateResults();
      }
    });

    // --- Initial render ---
    updateResults();
  };
})();
