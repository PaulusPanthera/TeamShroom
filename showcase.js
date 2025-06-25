// showcase.js
// Team Shroom: member showcase logic (fetch, build, render, scoreboard, sorting)
// Now as an ES module, using centralized utils and no window globals.

import { renderUnifiedCard } from './unifiedcard.js';
import { normalizeMemberName, prettifyMemberName, normalizePokemonName } from './utils.js';

// --- DATA FETCHING AND STRUCTURE ---
// (Data is now loaded and passed in by main.js; no fetching here.)

// --- Helper to build a GIF URL for a Pokémon ---
function getPokemonGif(name) {
  // Normalize to catch any variant of Mr. Mime or Mime Jr.
  const n = name.replace(/[\s.'’\-]/g, "").toLowerCase();
  if (n === "mrmime") return "https://img.pokemondb.net/sprites/black-white/anim/shiny/mr-mime.gif";
  if (n === "mimejr") return "https://img.pokemondb.net/sprites/black-white/anim/shiny/mime-jr.gif";
  if (n === "nidoranf") return "https://img.pokemondb.net/sprites/black-white/anim/shiny/nidoran-f.gif";
  if (n === "nidoranm") return "https://img.pokemondb.net/sprites/black-white/anim/shiny/nidoran-m.gif";
  if (n === "typenull") return "https://img.pokemondb.net/sprites/black-white/anim/shiny/type-null.gif";
  if (n === "porygonz") return "https://img.pokemondb.net/sprites/black-white/anim/shiny/porygon-z.gif";
  let urlName = normalizePokemonName(name);
  return `https://img.pokemondb.net/sprites/black-white/anim/shiny/${urlName}.gif`;
}

// Get a member's shinies (with fallback for missing data)
function getMemberShinies(teamShowcase, member) {
  // If the member object already has a 'shinies' array, use it directly and preserve all properties
  if (member && Array.isArray(member.shinies) && member.shinies.length > 0) {
    return member.shinies.map(mon => ({
      ...mon,
      name: mon.name,
      url: getPokemonGif(mon.name),
      lost: !!mon.lost
    }));
  }
  if (!teamShowcase) {
    return [];
  }
  const showcaseEntry = teamShowcase.find(
    m => m.name.toLowerCase() === member.name.toLowerCase()
  );
  if (!showcaseEntry || !Array.isArray(showcaseEntry.shinies)) {
    return [];
  }
  return showcaseEntry.shinies.map(mon => ({
    ...mon,
    name: mon.name,
    url: getPokemonGif(mon.name),
    lost: !!mon.lost
  }));
}

// Improved member sprite loader: load examplesprite.png first, then try custom PNG/JPG/GIF, swap in if exists.
function getMemberSpriteUrl(memberName) {
  const base = normalizeMemberName(memberName);
  // Always use the placeholder first, swap in custom avatar only if it loads.
  return `img/membersprites/examplesprite.png`;
}

// --- SCOREBOARD POINT LOGIC ---
function getPointsForPokemon(name, extra = {}, POKEMON_POINTS, TIER_FAMILIES, pokemonFamilies) {
  if (!POKEMON_POINTS) return 1;

  let normName = normalizePokemonName(name);
  let basePoints = POKEMON_POINTS[normName] || 1;

  // Alpha: always 50
  if (extra.alpha) return 50;

  // Egg: 20 unless tier 0 or 1 (then use tier points)
  if (extra.egg) {
    if (!getPointsForPokemon._tier01set) {
      const TIER_0_1 = (TIER_FAMILIES?.["Tier 0"] || []).concat(TIER_FAMILIES?.["Tier 1"] || []);
      let allNames = [];
      TIER_0_1.forEach(base => {
        let familyBase = base
          .toLowerCase()
          .replace(/\[.*\]/g,"")
          .replace(/♀/g,"-f")
          .replace(/♂/g,"-m")
          .replace(/[- '\.’]/g,"")
          .trim();
        if(pokemonFamilies && pokemonFamilies[familyBase]) {
          pokemonFamilies[familyBase].forEach(famName => {
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
      getPointsForPokemon._tier01set = new Set(allNames);
    }
    if (!getPointsForPokemon._tier01set.has(normName)) return 20;
    // else fall through to base tier points
  }

  // Secret/safari bonuses
  let bonus = 0;
  if (extra.secret) bonus += 10;
  if (extra.safari) bonus += 5;

  return basePoints + bonus;
}

function getMemberScoreboardPoints(member, teamShowcase, POKEMON_POINTS, TIER_FAMILIES, pokemonFamilies) {
  const showcaseEntry = (teamShowcase || []).find(
    m => m.name.toLowerCase() === member.name.toLowerCase()
  );
  if (!showcaseEntry || !Array.isArray(showcaseEntry.shinies)) return 0;
  return showcaseEntry.shinies
    .filter(mon => !mon.lost)
    .reduce((sum, mon, i) => {
      const extra = showcaseEntry.shinies[i] || {};
      return sum + getPointsForPokemon(mon.name, extra, POKEMON_POINTS, TIER_FAMILIES, pokemonFamilies);
    }, 0);
}

// Utility to clean up Pokémon names for display
function cleanPokemonName(name) {
  let cleaned = name
    .replace(/-(f|m|red-striped|blue-striped|east|west|galar|alola|hisui|paldea|mega|gigantamax|therian|origin|sky|dawn|midnight|midday|school|solo|rainy|sunny|snowy|attack|defense|speed|wash|heat|fan|frost|mow|midnight|midday|dusk|baile|pom-pom|pa'u|sensu|starter|battle-bond|ash|crowned|eternamax|gmax|complete|single-strike|rapid-strike)[^a-z0-9]*$/i, '')
    .replace(/-/g, ' ')
    .replace(/\s+/, ' ')
    .trim();
  cleaned = cleaned.replace(/\b\w/g, l => l.toUpperCase());
  return cleaned;
}

// --- MAIN GALLERY RENDERING ---
export function renderShowcaseGallery(members, container, groupMode, teamShowcase, POKEMON_POINTS, TIER_FAMILIES, pokemonFamilies) {
  if (!container) container = document.getElementById('showcase-gallery-container');
  container.innerHTML = "";

  // Total shinies
  let total = 0;
  if (teamShowcase) {
    teamShowcase.forEach(entry => {
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
    grouped = groupMembersByPoints(members, teamShowcase, POKEMON_POINTS, TIER_FAMILIES, pokemonFamilies);
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
      // Always start with the placeholder, and try to load a custom avatar in JS
      let spriteUrl = getMemberSpriteUrl(member.name);
      let info = `Shinies: ${member.shinies}`;
      if (groupMode === "scoreboard") {
        const pts = getMemberScoreboardPoints(member, teamShowcase, POKEMON_POINTS, TIER_FAMILIES, pokemonFamilies);
        info = `Points: ${pts}`;
      }
      gallery.innerHTML += renderUnifiedCard({
        name: member.name,
        img: spriteUrl,
        info,
        cardType: "member",
        memberStatus: member.status,
        donatorStatus: member.donator // Set dynamically elsewhere
      });
    });

    container.appendChild(gallery);
  });

  // After render: try to swap in custom avatar if it exists (no 404s for missing)
  setTimeout(() => {
    // Entire card clickable
    container.querySelectorAll('.unified-card').forEach(card => {
      card.style.cursor = 'pointer';
      card.onclick = function (e) {
        if (window.getSelection && window.getSelection().toString()) return;
        const cardType = card.getAttribute('data-card-type');
        const cardName = card.getAttribute('data-name');
        if (cardType === "member") {
          const sortSelect = document.querySelector('.showcase-search-controls select');
          const sortMode = (sortSelect && sortSelect.value) || "alphabetical";
          location.hash = `#showcase-${cardName}`;
        }
      };
    });

    // Improved: Only try to swap in a member sprite if it exists, to avoid 404s
    container.querySelectorAll('.unified-card[data-card-type="member"] .unified-img').forEach(img => {
      const base = img.getAttribute('alt').toLowerCase().replace(/\s+/g, '');
      const formats = ['png', 'jpg', 'gif'];
      let tried = 0;
      function tryNextFormat() {
        if (tried >= formats.length) return;
        const testUrl = `img/membersprites/${base}sprite.${formats[tried]}`;
        const testImg = new window.Image();
        testImg.onload = function() {
          img.src = testUrl; // Swap in custom avatar
        };
        testImg.onerror = function() {
          tried++;
          tryNextFormat();
        };
        testImg.src = testUrl;
      }
      tryNextFormat();
    });

    // For Pokémon cards (fallback logic unchanged)
    container.querySelectorAll('.unified-card:not([data-card-type="member"]) .unified-img').forEach(img => {
      img.onerror = function() {
        this.onerror = null;
        this.src = "img/membersprites/examplesprite.png";
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
function groupMembersByPoints(members, teamShowcase, POKEMON_POINTS, TIER_FAMILIES, pokemonFamilies) {
  const grouped = {};
  members.forEach(member => {
    const points = getMemberScoreboardPoints(member, teamShowcase, POKEMON_POINTS, TIER_FAMILIES, pokemonFamilies);
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
export function renderMemberShowcase(member, sortMode = "alphabetical", teamShowcase, POKEMON_POINTS, TIER_FAMILIES, pokemonFamilies) {
  const content = document.getElementById('page-content');
  const shinies = getMemberShinies(teamShowcase, member);

  const showcaseEntry = (teamShowcase || []).find(
    m => m.name.toLowerCase() === member.name.toLowerCase()
  );

  let totalPoints = 0;
  if (showcaseEntry && Array.isArray(showcaseEntry.shinies)) {
    totalPoints = showcaseEntry.shinies
      .filter(mon => !mon.lost)
      .reduce((sum, mon, i) => {
        const extra = showcaseEntry.shinies[i] || {};
        return sum + getPointsForPokemon(mon.name, extra, POKEMON_POINTS, TIER_FAMILIES, pokemonFamilies);
      }, 0);
  }

  content.innerHTML = `
    <button class="back-btn" onclick="window.location.hash='#showcase?sort=${sortMode}'">← Back</button>
    <div class="member-nameplate">
      <span class="member-name">${member.name}</span>
      <span class="shiny-count">Shinies: ${shinies.filter(mon => !mon.lost).length}</span>
      <span class="point-count">Points: ${totalPoints}</span>
    </div>
    <div class="dex-grid" style="margin-top:1em;">
      ${shinies.map((mon, i) => {
        const name = cleanPokemonName(mon.name);
        // Use the mon object itself for extra properties (icons, etc)
        let extra = mon || {};
        const hasClip = typeof extra.clip === "string" && extra.clip.trim().length > 0;
        const monPoints = getPointsForPokemon(mon.name, extra, POKEMON_POINTS, TIER_FAMILIES, pokemonFamilies);
        return renderUnifiedCard({
          name: name,
          img: mon.url,
          info: mon.lost ? "Lost" : `${monPoints} Points`,
          lost: mon.lost,
          cardType: "pokemon",
          clip: hasClip ? extra.clip : undefined,
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

  setTimeout(() => {
    content.querySelectorAll('.unified-card').forEach(card => {
      card.style.cursor = 'pointer';
      card.onclick = function (e) {
        if (window.getSelection && window.getSelection().toString()) return;
        const cardType = card.getAttribute('data-card-type');
        const clipUrl = card.getAttribute('data-clip');
        if (cardType === "pokemon" && clipUrl) {
          window.open(clipUrl, "_blank");
          return;
        }
      };
    });
  }, 0);
}

// --- SEARCH AND SORT SETUP ---
export function setupShowcaseSearchAndSort(teamMembers, renderShowcaseGalleryCb, initialSortMode, teamShowcase, POKEMON_POINTS, TIER_FAMILIES, pokemonFamilies) {
  const controls = document.querySelector('.showcase-search-controls');
  controls.innerHTML = "";

  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.placeholder = 'Search Member';
  controls.appendChild(searchInput);

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

  const resultCount = document.createElement('span');
  controls.appendChild(resultCount);

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
        const diff = getMemberScoreboardPoints(b, teamShowcase, POKEMON_POINTS, TIER_FAMILIES, pokemonFamilies) - getMemberScoreboardPoints(a, teamShowcase, POKEMON_POINTS, TIER_FAMILIES, pokemonFamilies);
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
    renderShowcaseGalleryCb(filtered, galleryContainer, sortMode, teamShowcase, POKEMON_POINTS, TIER_FAMILIES, pokemonFamilies);
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
}
