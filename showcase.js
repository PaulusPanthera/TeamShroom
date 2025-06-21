// Team Shroom members and their shiny counts
// Uses unified-card for all member and shiny cards

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
    .replace(/♀/g, "-f")
    .replace(/♂/g, "-m")
    .replace(/[\s.'’]/g, "");
  return `https://img.pokemondb.net/sprites/black-white/anim/shiny/${urlName}.gif`;
}

// Helper to get a member's shinies (make sure teamShowcase is loaded!)
function getMemberShinies(member) {
  if (!window.teamShowcase) {
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
function getPointsForPokemon(name, extra = {}) {
  if (!window.POKEMON_POINTS && window.buildPokemonPoints) window.buildPokemonPoints();
  if (!window.POKEMON_POINTS) return 1;

  let normName = name
    .toLowerCase()
    .replace(/♀/g, "-f")
    .replace(/♂/g, "-m")
    .replace(/[\s.'’]/g, "");
  let basePoints = window.POKEMON_POINTS[normName] || 1;

  // Alpha: always 50
  if (extra.alpha) return 50;

  // Egg: 20 unless tier 0 or 1 (then use tier points)
  if (extra.egg) {
    if (!window._tier01set) {
      const TIER_0_1 = (window.TIER_FAMILIES?.["Tier 0"] || []).concat(window.TIER_FAMILIES?.["Tier 1"] || []);
      let allNames = [];
      TIER_0_1.forEach(base => {
        let familyBase = base
          .toLowerCase()
          .replace(/\[.*\]/g,"")
          .replace(/♀/g,"-f")
          .replace(/♂/g,"-m")
          .replace(/[- '\.’]/g,"")
          .trim();
        if(window.pokemonFamilies && window.pokemonFamilies[familyBase]) {
          window.pokemonFamilies[familyBase].forEach(famName => {
            let key = famName
              .toLowerCase()
              .replace(/♀/g,"-f")
              .replace(/♂/g,"-m")
              .replace(/[- '\.’]/g,"")
              .trim();
            allNames.push(key);
          });
        } else {
          allNames.push(familyBase);
        }
      });
      window._tier01set = new Set(allNames);
      // DEBUG: Print set for troubleshooting
      console.log("tier01 set contents:", Array.from(window._tier01set));
    }
    // DEBUG OUTPUT:
    console.log('EGG CHECK', { normName, inTier01: window._tier01set.has(normName), basePoints, extra });
    if (!window._tier01set.has(normName)) return 20;
    // else fall through to base tier points
  }

  // Secret/safari bonuses
  let bonus = 0;
  if (extra.secret) bonus += 10;
  if (extra.safari) bonus += 5;

  return basePoints + bonus;
}
function getMemberScoreboardPoints(member) {
  const showcaseEntry = (window.teamShowcase || []).find(m => m.name === member.name);
  if (!showcaseEntry || !Array.isArray(showcaseEntry.shinies)) return 0;
  return showcaseEntry.shinies
    .filter(mon => !mon.lost)
    .reduce((sum, mon, i) => {
      const extra = showcaseEntry.shinies[i] || {};
      return sum + getPointsForPokemon(mon.name, extra);
    }, 0);
}

// Utility to clean up Pokémon names
function cleanPokemonName(name) {
  let cleaned = name
    .replace(/-(f|m|red-striped|blue-striped|east|west|galar|alola|hisui|paldea|mega|gigantamax|therian|origin|sky|dawn|midnight|midday|school|solo|rainy|sunny|snowy|attack|defense|speed|wash|heat|fan|frost|mow|midnight|midday|dusk|baile|pom-pom|pa'u|sensu|starter|battle-bond|ash|crowned|eternamax|gmax|complete|single-strike|rapid-strike)[^a-z0-9]*$/i, '')
    .replace(/-/g, ' ')
    .replace(/\s+/, ' ')
    .trim();
  cleaned = cleaned.replace(/\b\w/g, l => l.toUpperCase());
  return cleaned;
}

// --- FORCE TIER01 SET REBUILD SUPPORT ---
window.rebuildTier01Set = function() {
  window._tier01set = null;
};

// --- MAIN GALLERY RENDERING ---
// This version: Each group/category has a header, followed by a grid of member cards for that group.
function renderShowcaseGallery(members, container, groupMode) {
  if (!container) container = document.getElementById('showcase-gallery-container');
  container.innerHTML = "";

  // Total shinies
  let total = 0;
  if (window.teamShowcase) {
    window.teamShowcase.forEach(entry => {
      if (Array.isArray(entry.shinies)) {
        total += entry.shinies.filter(mon => !mon.lost).length;
      }
    });
  }
  const totalDiv = document.createElement("div");
  totalDiv.className = "total-shinies-count";
  totalDiv.style = "font-size: 1.25em; font-weight: bold; color: var(--accent); margin-bottom: 1.5em; text-align:center;";
  totalDiv.textContent = `Total Shinies: ${total}`;
  container.appendChild(totalDiv);

  // Grouping
  let grouped;
  if (groupMode === "scoreboard") {
    grouped = groupMembersByPoints(members);
  } else if (groupMode === "shinies") {
    grouped = groupMembersByShinies(members);
  } else {
    grouped = groupMembersAlphabetically(members);
  }

  // For each group, render a header and a grid of member cards for that group.
  grouped.forEach(group => {
    // Header
    const header = document.createElement('div');
    header.className = "showcase-category-header";
    header.textContent = group.header + (groupMode === "scoreboard" ? " Points" : "");
    container.appendChild(header);

    // Grid for cards
    const gallery = document.createElement('div');
    gallery.className = 'showcase-gallery';

    group.members.forEach(member => {
      const spriteUrls = getMemberSpriteUrls(member.name);
      let spriteUrl = spriteUrls[0];
      let info = `Shinies: ${member.shinies}`;
      if (groupMode === "scoreboard") {
        const pts = getMemberScoreboardPoints(member);
        info = `Points: ${pts}`;
      }
      gallery.innerHTML += renderUnifiedCard({
        name: member.name,
        img: spriteUrl,
        info,
        cardType: "member"
      });
    });

    container.appendChild(gallery);
  });

  // Add fallback/error/click handler for images and cards
  setTimeout(() => {
    // Entire card clickable (for both member and Pokémon cards in the future)
    container.querySelectorAll('.unified-card').forEach(card => {
      card.style.cursor = 'pointer';
      card.onclick = function (e) {
        // Don't trigger if user is selecting text
        if (window.getSelection && window.getSelection().toString()) return;
        const cardType = card.getAttribute('data-card-type');
        const cardName = card.getAttribute('data-name');
        if (cardType === "member") {
          // Use the current sort mode
          const sortSelect = document.querySelector('.showcase-search-controls select');
          const sortMode = (sortSelect && sortSelect.value) || "alphabetical";
          location.hash = `#showcase-${cardName}?sort=${sortMode}`;
        } else if (cardType === "pokemon") {
          // Future: open Pokédex view, etc.
        }
      };
    });

    // Keep the existing image fallback handler for broken images
    container.querySelectorAll('.unified-img').forEach(img => {
      img.onerror = function() {
        if (!this._srcIndex) this._srcIndex = 1;
        else this._srcIndex++;
        const base = this.getAttribute('alt').toLowerCase().replace(/\s+/g, '');
        const fallbackUrls = [
          `membersprites/${base}sprite.png`,
          `membersprites/${base}sprite.jpg`,
          `membersprites/${base}sprite.gif`
        ];
        if (this._srcIndex < fallbackUrls.length) {
          this.src = fallbackUrls[this._srcIndex];
        } else {
          this.onerror = null;
          this.src = "examplesprite.png";
        }
      };
    });
  }, 0);
}

// --- HELPER GROUPS ---
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
function groupMembersByShinies(members) {
  const grouped = {};
  members.forEach(member => {
    const count = member.shinies || 0;
    if (!grouped[count]) grouped[count] = [];
    grouped[count].push(member);
  });
  return Object.keys(grouped)
    .map(Number)
    .sort((a, b) => b - a)
    .map(count => ({
      header: count,
      members: grouped[count].sort((a, b) => a.name.localeCompare(b.name))
    }));
}
function groupMembersByPoints(members) {
  const grouped = {};
  members.forEach(member => {
    const points = getMemberScoreboardPoints(member);
    if (!grouped[points]) grouped[points] = [];
    grouped[points].push(member);
  });
  return Object.keys(grouped)
    .map(Number)
    .sort((a, b) => b - a)
    .map(points => ({
      header: points,
      members: grouped[points].sort((a, b) => a.name.localeCompare(b.name))
    }));
}

// --- MEMBER SHOWCASE ---
function renderMemberShowcase(member, sortMode = "alphabetical") {
  const content = document.getElementById('page-content');
  const shinies = getMemberShinies(member);
  // Find the showcase data for this member so we can get the extra flags for each shiny
  const showcaseEntry = (window.teamShowcase || []).find(m => m.name === member.name);

  // Compute total points for this member (using updated logic)
  let totalPoints = 0;
  if (showcaseEntry && Array.isArray(showcaseEntry.shinies)) {
    totalPoints = showcaseEntry.shinies
      .filter(mon => !mon.lost)
      .reduce((sum, mon, i) => {
        const extra = showcaseEntry.shinies[i] || {};
        return sum + getPointsForPokemon(mon.name, extra);
      }, 0);
  }

  content.innerHTML = `
    <button class="back-btn" onclick="window.location.hash='#showcase?sort=${sortMode}'">← Back</button>
    <h1>${member.name}'s Shiny Showcase</h1>
    <div>Shinies: ${shinies.filter(mon => !mon.lost).length} | Points: ${totalPoints}</div>
    <div class="dex-grid" style="margin-top:1em;">
      ${shinies.map((mon, i) => {
        const name = cleanPokemonName(mon.name);
        // Get extra symbol fields if present in teamShowcase (alpha, egg, etc)
        let extra = (showcaseEntry && showcaseEntry.shinies && showcaseEntry.shinies[i]) || {};
        // --- PATCH: If extra.clip is a string (the link), use !!extra.clip for the symbol
        const hasClip = typeof extra.clip === "string" && extra.clip.trim().length > 0;
        const monPoints = getPointsForPokemon(mon.name, extra);
        return renderUnifiedCard({
          name: name,
          img: mon.url,
          info: mon.lost ? "Lost" : `${monPoints} Points`,
          lost: mon.lost,
          cardType: "pokemon",
          clip: hasClip ? extra.clip : undefined,
          // Only pass these for the showcase, not for the main dex!
          symbols: {
            secret: !!extra.secret,
            egg: !!extra.egg,
            safari: !!extra.safari,
            event: !!extra.event,
            alpha: !!extra.alpha,
            clip: hasClip
          }
        });
      }).join("")}
    </div>
  `;

  // Make Pokémon cards clickable, opening the clip if present
  setTimeout(() => {
    content.querySelectorAll('.unified-card').forEach(card => {
      card.style.cursor = 'pointer';
      card.onclick = function (e) {
        if (window.getSelection && window.getSelection().toString()) return;
        const cardType = card.getAttribute('data-card-type');
        const cardName = card.getAttribute('data-name');
        const clipUrl = card.getAttribute('data-clip');
        if (cardType === "pokemon" && clipUrl) {
          window.open(clipUrl, "_blank");
          return;
        }
        // (rest of logic for other card types)
      };
    });
  }, 0);
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

    // Dropdown menu for sort
    const sortSelect = document.createElement('select');
    sortSelect.style.marginLeft = '0.7em';
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

    // Set from hash if available
    let sortMode = (function(){
      const m = window.location.hash.match(/sort=(\w+)/);
      return m ? m[1] : (initialSortMode || "alphabetical");
    })();
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

    function updateResults(pushHash = false) {
      const filtered = getFilteredAndSortedMembers();
      resultCount.textContent = `${filtered.length} Member${filtered.length === 1 ? '' : 's'}`;
      const galleryContainer = document.getElementById('showcase-gallery-container');
      renderShowcaseGallery(filtered, galleryContainer, sortMode);
      if (pushHash) {
        window.location.hash = `#showcase?sort=${sortMode}`;
      }
      sortSelect.value = sortMode;
    }

    searchInput.addEventListener('input', e => {
      searchValue = e.target.value;
      updateResults();
    });

    sortSelect.addEventListener('change', e => {
      sortMode = e.target.value;
      updateResults(true);
    });

    updateResults();
  };
})();
