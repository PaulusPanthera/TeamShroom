// Team Shroom members and their shiny counts
// This version AUTOMATICALLY counts shinies from teamShowcase.js, EXCLUDING lost shinies, and displays a total shinies counter.

const teamMembers = (window.teamShowcase || []).map(entry => ({
  name: entry.name,
  shinies: Array.isArray(entry.shinies)
    ? entry.shinies.filter(mon => !mon.lost).length
    : 0
}));

// Helper to generate the correct shiny gif url
function shinyGifUrl(name) {
  let urlName = name
    .toLowerCase()
    .replace(/[\s.]/g, "-")
    .replace(/-f$/, "-f")
    .replace(/-m$/, "-m");
  return `https://img.pokemondb.net/sprites/black-white/anim/shiny/${urlName}.gif`;
}

// Helper to get a member's shinies (make sure teamShowcase is loaded!)
function getMemberShinies(member) {
  if (!window.teamShowcase) {
    // fallback: create placeholder shinies if data missing
    return Array.from({ length: member.shinies }, () => ({
      name: "Placeholder",
      url: "examplesprite.gif",
      lost: false
    }));
  }
  const showcaseEntry = teamShowcase.find(m => m.name === member.name);
  if (!showcaseEntry || !Array.isArray(showcaseEntry.shinies)) {
    return Array.from({ length: member.shinies }, () => ({
      name: "Placeholder",
      url: "examplesprite.gif",
      lost: false
    }));
  }
  return showcaseEntry.shinies.map(mon => ({
    name: mon.name,
    url: shinyGifUrl(mon.name),
    lost: !!mon.lost
  }));
}

// Helper to get the custom sprite path for a member (tries png, jpg, gif in /membersprites/)
function getMemberSpriteUrls(memberName) {
  const base = memberName.toLowerCase().replace(/\s+/g, '');
  return [
    `membersprites/${base}sprite.png`,
    `membersprites/${base}sprite.jpg`,
    `membersprites/${base}sprite.gif`
  ];
}

// --- SCOREBOARD POINT LOGIC ---
function getPointsForPokemon(name) {
  if (!window.POKEMON_POINTS && window.buildPokemonPoints) window.buildPokemonPoints();
  if (!window.POKEMON_POINTS) return 1;
  let normName = name
    .toLowerCase()
    .replace(/♀/g, "-f")
    .replace(/♂/g, "-m")
    .replace(/[\s.'’]/g, "");
  return window.POKEMON_POINTS[normName] || 1;
}
function getMemberScoreboardPoints(member) {
  const showcaseEntry = (window.teamShowcase || []).find(m => m.name === member.name);
  if (!showcaseEntry || !Array.isArray(showcaseEntry.shinies)) return 0;
  return showcaseEntry.shinies
    .filter(mon => !mon.lost)
    .reduce((sum, mon) => sum + getPointsForPokemon(mon.name), 0);
}

// Group by first letter (A-Z)
function groupMembersAlphabetically(members) {
  const grouped = {};
  members.forEach(member => {
    const firstLetter = member.name[0].toUpperCase();
    if (!grouped[firstLetter]) grouped[firstLetter] = [];
    grouped[firstLetter].push(member);
  });
  return Object.keys(grouped).sort().map(letter => ({
    header: letter,
    members: grouped[letter].sort((a, b) => a.name.localeCompare(b.name))
  }));
}

// Group by shiny count (descending)
function groupMembersByShinies(members) {
  const grouped = {};
  members.forEach(member => {
    const count = member.shinies || 0;
    if (!grouped[count]) grouped[count] = [];
    grouped[count].push(member);
  });
  // Descending order of shiny count
  return Object.keys(grouped)
    .map(Number)
    .sort((a, b) => b - a)
    .map(count => ({
      header: count,
      members: grouped[count].sort((a, b) => a.name.localeCompare(b.name))
    }));
}

// Group by scoreboard points (descending)
function groupMembersByPoints(members) {
  const grouped = {};
  members.forEach(member => {
    const points = getMemberScoreboardPoints(member);
    if (!grouped[points]) grouped[points] = [];
    grouped[points].push(member);
  });
  // Descending order of points
  return Object.keys(grouped)
    .map(Number)
    .sort((a, b) => b - a)
    .map(points => ({
      header: points,
      members: grouped[points].sort((a, b) => a.name.localeCompare(b.name))
    }));
}

// Main gallery rendering (accepts groupMode: "alphabetical", "shinies", or "scoreboard")
function renderShowcaseGallery(members, container, groupMode) {
  if (!container) container = document.getElementById('showcase-gallery-container');
  container.innerHTML = "";

  // --- Total shinies count (across all members, excluding lost) ---
  let total = 0;
  if (window.teamShowcase) {
    window.teamShowcase.forEach(entry => {
      if (Array.isArray(entry.shinies)) {
        total += entry.shinies.filter(mon => !mon.lost).length;
      }
    });
  }

  // Insert total at the top
  const totalDiv = document.createElement("div");
  totalDiv.className = "total-shinies-count";
  totalDiv.style = "font-size: 1.25em; font-weight: bold; color: var(--accent); margin-bottom: 1.5em; text-align:center;";
  totalDiv.textContent = `Total Shinies: ${total}`;
  container.appendChild(totalDiv);

  let grouped;
  if (groupMode === "scoreboard") {
    grouped = groupMembersByPoints(members);
  } else if (groupMode === "shinies") {
    grouped = groupMembersByShinies(members);
  } else {
    grouped = groupMembersAlphabetically(members);
  }

  grouped.forEach(group => {
    const section = document.createElement("section");
    section.className = "showcase-letter-section";
    section.innerHTML = `<h2>${group.header}${groupMode === "scoreboard" ? " Points" : ""}</h2>
      <div class="showcase-gallery"></div>
    `;
    const gallery = section.querySelector(".showcase-gallery");
    gallery.style.display = "grid";
    gallery.style.gridTemplateColumns = "repeat(6, 1fr)";
    gallery.style.gap = "1.5rem";

    group.members.forEach(member => {
      const spriteUrls = getMemberSpriteUrls(member.name);
      const entry = document.createElement("div");
      entry.className = "showcase-entry";

      // Provide shiny count and point count
      let countStr = `Shinies: ${member.shinies}`;
      if (groupMode === "scoreboard") {
        const pts = getMemberScoreboardPoints(member);
        countStr = `Points: ${pts}`;
      }

      entry.innerHTML = `
        <div class="showcase-name">${member.name}</div>
        <img src="${spriteUrls[0]}" class="showcase-sprite" alt="${member.name}" data-member="${member.name}">
        <div class="showcase-shiny-count">${countStr}</div>
      `;

      // Fallback chain: try png, then jpg, then gif, then placeholder
      const img = entry.querySelector(".showcase-sprite");
      img.onerror = function onErr() {
        if (!this._srcIndex) this._srcIndex = 1;
        else this._srcIndex++;
        if (this._srcIndex < spriteUrls.length) {
          this.src = spriteUrls[this._srcIndex];
        } else {
          this.onerror = null;
          this.src = "examplesprite.gif";
        }
      };

      img.onclick = e => {
        // Get current sort mode from radio input
        const sortModeEl = document.querySelector('input[name="showcase-sort"]:checked');
        const sortMode = sortModeEl ? sortModeEl.value : 'alphabetical';
        location.hash = `#showcase-${member.name}?sort=${sortMode}`;
      };
      gallery.appendChild(entry);
    });

    container.appendChild(section);
  });
}

// Show a single member's full shiny showcase
function renderMemberShowcase(member, sortMode = "alphabetical") {
  const content = document.getElementById('page-content');
  const shinies = getMemberShinies(member);
  // Show both shiny count and points
  const points = getMemberScoreboardPoints(member);
  content.innerHTML = `
    <button class="back-btn" onclick="window.location.hash='#showcase?sort=${sortMode}'">← Back</button>
    <h1>${member.name}'s Shiny Showcase</h1>
    <div>Shinies: ${shinies.filter(mon => !mon.lost).length} | Points: ${points}</div>
    <div class="showcase-shinies" style="display:flex;flex-wrap:wrap;gap:12px;margin-top:1em;">
      ${shinies.map(mon => {
        const monPoints = getPointsForPokemon(mon.name);
        return `
        <div class="showcase-shiny-img-wrapper${mon.lost ? ' lost' : ''}" style="width:120px;height:150px;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;">
          <img src="${mon.url}" alt="${mon.name}${mon.lost ? ' (lost)' : ''}" class="showcase-shiny-img${mon.lost ? ' lost' : ''}" style="width:100px;height:100px;image-rendering:pixelated;" title="${mon.name}${mon.lost ? ' (lost)' : ''}">
          <div class="dex-name" style="margin-top:3px;font-size:.85em">${mon.name}</div>
          <div class="dex-claimed" style="font-size:.75em;color:var(--text-muted)">${mon.lost ? 'Lost' : monPoints + ' Points'}</div>
        </div>
        `;
      }).join("")}
    </div>
  `;
}

// --- SEARCH AND SORT SETUP ---
(function(){
  window.setupShowcaseSearchAndSort = function(teamMembers, renderShowcaseGallery, initialSortMode) {
    const controls = document.querySelector('.showcase-search-controls');
    controls.innerHTML = "";

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Search Member';
    controls.appendChild(searchInput);

    const sortDiv = document.createElement('div');
    sortDiv.style.display = 'flex';
    sortDiv.style.gap = '0.8em';
    [
      ["A-Z", "alphabetical"],
      ["Total Shinies", "shinies"],
      ["Scoreboard", "scoreboard"]
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

    const resultCount = document.createElement('span');
    controls.appendChild(resultCount);

    let sortMode = initialSortMode || 'alphabetical';
    // Set checked based on initialSortMode
    sortDiv.querySelectorAll('input[name="showcase-sort"]').forEach(radio => {
      radio.checked = radio.value === sortMode;
    });

    let searchValue = '';

    function getFilteredAndSortedMembers() {
      const input = searchValue.trim().toLowerCase();
      let filtered = teamMembers.filter(m => m.name.toLowerCase().includes(input));
      if (sortMode === 'alphabetical') {
        filtered.sort((a, b) => a.name.localeCompare(b.name));
      } else if (sortMode === 'shinies') {
        filtered.sort((a, b) => {
          const diff = (b.shinies || 0) - (a.shinies || 0);
          if (diff !== 0) return diff;
          return a.name.localeCompare(b.name);
        });
      } else if (sortMode === 'scoreboard') {
        filtered.sort((a, b) => {
          const diff = getMemberScoreboardPoints(b) - getMemberScoreboardPoints(a);
          if (diff !== 0) return diff;
          return a.name.localeCompare(b.name);
        });
      }
      return filtered;
    }

    function updateResults() {
      const filtered = getFilteredAndSortedMembers();
      // Use "Member" for result count in showcase
      resultCount.textContent = `${filtered.length} Member${filtered.length === 1 ? '' : 's'}`;
      const galleryContainer = document.getElementById('showcase-gallery-container');
      renderShowcaseGallery(filtered, galleryContainer, sortMode);
    }

    searchInput.addEventListener('input', e => {
      searchValue = e.target.value;
      updateResults();
    });

    sortDiv.querySelectorAll('input[name="showcase-sort"]').forEach(radio => {
      radio.addEventListener('change', e => {
        sortMode = e.target.value;
        updateResults();
      });
    });

    updateResults();
  };
})();
