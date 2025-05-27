(function(){
  // Accepts: teamMembers (array), renderShowcaseGallery (function)
  window.setupShowcaseSearchAndSort = function(teamMembers, renderShowcaseGallery) {
    // --- Create UI controls ---
    const controls = document.createElement('div');
    controls.className = "showcase-search-controls";

    // Search input
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Search Member';
    controls.appendChild(searchInput);

    // Sort controls (radio)
    const sortDiv = document.createElement('div');
    sortDiv.style.display = 'flex';
    sortDiv.style.gap = '0.8em';
    [
      ["A-Z", "alphabetical"],
      ["Total Shinies", "shinies"]
    ].forEach(([labelText, value]) => {
      const label = document.createElement('label');
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'showcase-sort';
      radio.value = value;
      if (value === 'alphabetical') radio.checked = true;
      label.appendChild(radio);
      label.appendChild(document.createTextNode(' ' + labelText));
      sortDiv.appendChild(label);
    });
    controls.appendChild(sortDiv);

    // Results count
    const resultCount = document.createElement('span');
    controls.appendChild(resultCount);

    // Insert controls at the top of #page-content (replace any existing)
    const content = document.getElementById('page-content');
    if (content.firstChild && content.firstChild.classList && content.firstChild.classList.contains('showcase-search-controls')) {
      content.removeChild(content.firstChild);
    }
    content.insertBefore(controls, content.firstChild);

    // --- Search/sort logic ---
    let sortMode = 'alphabetical';
    let searchValue = '';

    function getFilteredAndSortedMembers() {
      const input = searchValue.trim().toLowerCase();
      let filtered = teamMembers.filter(m => m.name.toLowerCase().includes(input));
      if (sortMode === 'alphabetical') {
        filtered.sort((a, b) => a.name.localeCompare(b.name));
      } else if (sortMode === 'shinies') {
        // Sort descending by shinies, then A-Z for ties
        filtered.sort((a, b) => {
          const diff = (b.shinies || 0) - (a.shinies || 0);
          if (diff !== 0) return diff;
          return a.name.localeCompare(b.name);
        });
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

    sortDiv.querySelectorAll('input[type=radio]').forEach(radio => {
      radio.addEventListener('change', e => {
        sortMode = e.target.value;
        updateResults();
      });
    });

    // --- Initial render ---
    updateResults();
  };
})();
