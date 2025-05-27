(function(){
  window.setupShowcaseSearchAndSort = function(teamMembers, renderShowcaseGallery) {
    // --- Create UI controls ---
    const controls = document.createElement('div');
    controls.style.display = 'flex';
    controls.style.alignItems = 'center';
    controls.style.gap = '1rem';
    controls.style.marginBottom = '1.5rem';

    // Search input
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Search Member';
    searchInput.style.padding = '0.5em';
    searchInput.style.borderRadius = '6px';
    searchInput.style.border = '1px solid #363b4a';
    searchInput.style.background = '#23243b';
    searchInput.style.color = '#00fff7';
    searchInput.style.fontFamily = "'Press Start 2P', 'Consolas', 'monospace'";
    searchInput.style.fontSize = '1em';
    controls.appendChild(searchInput);

    // Sort toggle (Alphabetical / Total Shinies)
    const toggleDiv = document.createElement('div');
    toggleDiv.style.display = 'flex';
    toggleDiv.style.gap = '0.4em';
    const sortOptions = [
      ["A-Z", "alphabetical"],
      ["Total Shinies", "shinies"]
    ];
    sortOptions.forEach(([labelText, value]) => {
      const label = document.createElement('label');
      label.style.cursor = 'pointer';
      label.style.fontWeight = 'bold';
      label.style.color = '#00fff7';
      label.style.marginRight = '0.5em';

      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'sort-toggle';
      radio.value = value;
      if (value === 'alphabetical') radio.checked = true;
      radio.style.accentColor = '#00fff7';

      label.appendChild(radio);
      label.appendChild(document.createTextNode(' ' + labelText));
      toggleDiv.appendChild(label);
    });
    controls.appendChild(toggleDiv);

    // Results count (optional)
    const resultCount = document.createElement('span');
    resultCount.style.minWidth = '68px';
    resultCount.style.textAlign = 'center';
    resultCount.style.color = '#00fff7bb';
    resultCount.style.fontWeight = "bold";
    controls.appendChild(resultCount);

    // Insert controls before the .showcase-gallery or its container
    const content = document.getElementById('page-content');
    content.insertBefore(controls, content.querySelector('.showcase-gallery') || content.firstChild);

    // --- Search/sort logic ---
    let sortMode = 'alphabetical';
    let searchValue = '';

    function getFilteredAndSortedMembers() {
      const input = searchValue.trim().toLowerCase();
      let filtered = teamMembers.filter(m => m.name.toLowerCase().includes(input));
      if (sortMode === 'alphabetical') {
        filtered.sort((a, b) => a.name.localeCompare(b.name));
      } else if (sortMode === 'shinies') {
        filtered.sort((a, b) => (b.shinies?.length || 0) - (a.shinies?.length || 0));
      }
      return filtered;
    }

    function updateResults() {
      const filtered = getFilteredAndSortedMembers();
      resultCount.textContent = `${filtered.length} result${filtered.length === 1 ? '' : 's'}`;
      renderShowcaseGallery(filtered);
    }

    // --- Event listeners ---
    searchInput.addEventListener('input', e => {
      searchValue = e.target.value;
      updateResults();
    });

    toggleDiv.querySelectorAll('input[type=radio]').forEach(radio => {
      radio.addEventListener('change', e => {
        sortMode = e.target.value;
        updateResults();
      });
    });

    // --- Initial render ---
    updateResults();
  };
})();
