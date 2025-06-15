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
      url: "examplesprite.png",
      lost: false
    }));
  }
  const showcaseEntry = teamShowcase.find(m => m.name === member.name);
  if (!showcaseEntry || !Array.isArray(showcaseEntry.shinies)) {
    return Array.from({ length: member.shinies }, () => ({
      name: "Placeholder",
      url: "examplesprite.png",
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

// Utility to clean up Pokémon names
function cleanPokemonName(name) {
  // Remove gender/family/variant suffixes
  let cleaned = name
    .replace(/-(f|m|red-striped|blue-striped|east|west|galar|alola|hisui|paldea|mega|gigantamax|therian|origin|sky|dawn|midnight|midday|school|solo|rainy|sunny|snowy|attack|defense|speed|wash|heat|fan|frost|mow|midnight|midday|dusk|baile|pom-pom|pa'u|sensu|starter|battle-bond|ash|crowned|eternamax|gmax|complete|single-strike|rapid-strike)[^a-z0-9]*$/i, '')
    .replace(/-/g, ' ')
    .replace(/\s+/, ' ')
    .trim();
  // Capitalize first letter of each word
  cleaned = cleaned.replace(/\b\w/g, l => l.toUpperCase());
  return cleaned;
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

      // Use the first sprite url that loads; fallback to gif if not found
      let spriteUrl = spriteUrls[0];
      entry.innerHTML = `
        <div class="showcase-name">${member.name}</div>
        <img src="${spriteUrl}" class="showcase-sprite" alt="${member.name}" data-member="${member.name}" style="width:100px;height:100px;object-fit:contain;">
        <div class="showcase-shiny-count">${countStr}</div>
      `;

      const img = entry.querySelector(".showcase-sprite");
      img.onerror = function onErr() {
        if (!this._srcIndex) this._srcIndex = 1;
        else this._srcIndex++;
        if (this._srcIndex < spriteUrls.length) {
          this.src = spriteUrls[this._srcIndex];
        } else {
          this.onerror = null;
          this.src = "examplesprite.png";
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
  const points = getMemberScoreboardPoints(member);

  content.innerHTML = `
    <button class="back-btn" onclick="window.location.hash='#showcase?sort=${sortMode}'">← Back</button>
    <h1>${member.name}'s Shiny Showcase</h1>
    <div>Shinies: ${shinies.filter(mon => !mon.lost).length} | Points: ${points}</div>
    <div class="showcase-shinies dex-grid" style="margin-top:1em;">
      ${shinies.map(mon => {
        const monPoints = getPointsForPokemon(mon.name);
        const name = cleanPokemonName(mon.name);
        return `
          <div class="dex-entry${mon.lost ? ' lost' : ' claimed'}" style="aspect-ratio:1/1;">
            <img src="${mon.url}" alt="${name}${mon.lost ? ' (lost)' : ''}" class="pokemon-gif showcase-shiny-img${mon.lost ? ' lost' : ''}">
            <div class="dex-name">${name}</div>
            <div class="dex-claimed" style="color:var(--success);">${mon.lost ? 'Lost' : monPoints + ' Points'}</div>
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

    // Search input
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Search Member';
    controls.appendChild(searchInput);

    // --- Dropdown menu for sort ---
    const sortSelect = document.createElement('select');
    sortSelect.style.marginLeft = '0.7em';
    sortSelect.style.fontFamily = 'inherit';
    sortSelect.style.fontSize = '1em';
    sortSelect.style.borderRadius = '8px';
    sortSelect.style.border = '1.5px solid var(--accent)';
    sortSelect.style.background = 'var(--card)';
    sortSelect.style.color = 'var(--accent)';
    sortSelect.style.padding = '0.35em 0.7em';

    // Add options
    [
      ["Alphabetical", "alphabetical"],
      ["Total Shinies", "shinies"],
      ["Total Shiny Points", "scoreboard"]
    ].forEach(([labelText, value]) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = labelText;
      sortSelect.appendChild(option);
    });

    controls.appendChild(sortSelect);

    // Result count
    const resultCount = document.createElement('span');
    controls.appendChild(resultCount);

    let sortMode = initialSortMode || 'alphabetical';
    sortSelect.value = sortMode;

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
      resultCount.textContent = `${filtered.length} Member${filtered.length === 1 ? '' : 's'}`;
      const galleryContainer = document.getElementById('showcase-gallery-container');
      renderShowcaseGallery(filtered, galleryContainer, sortMode);
    }

    searchInput.addEventListener('input', e => {
      searchValue = e.target.value;
      updateResults();
    });

    sortSelect.addEventListener('change', e => {
      sortMode = e.target.value;
      updateResults();
    });

    updateResults();
  };
})();
