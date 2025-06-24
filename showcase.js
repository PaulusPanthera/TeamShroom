// showcase.js

// --- ICON LEGEND DATA ---
const DONATOR_MEMBER_ICONS = [
  {
    icon: "symbols/topdonatorsprite.png",
    label: "Top Donator",
    desc: "Our #1 supporter! Thank you for your incredible generosity."
  },
  {
    icon: "symbols/diamonddonatorsprite.png",
    label: "Diamond Donator",
    desc: "Donated 50,000,000 or more Pokéyen or value in items."
  },
  {
    icon: "symbols/platinumdonatorsprite.png",
    label: "Platinum Donator",
    desc: "Donated 25,000,000 or more Pokéyen or value in items."
  },
  {
    icon: "symbols/golddonatorsprite.png",
    label: "Gold Donator",
    desc: "Donated 10,000,000 or more Pokéyen or value in items."
  },
  {
    icon: "symbols/silverdonatorsprite.png",
    label: "Silver Donator",
    desc: "Donated 5,000,000 or more Pokéyen or value in items."
  },
  {
    icon: "symbols/bronzedonatorsprite.png",
    label: "Bronze Donator",
    desc: "Donated 1,000,000 or more Pokéyen or value in items."
  },
  {
    icon: "symbols/shroomsprite.png",
    label: "Team Member",
    desc: "Active member of Team Shroom."
  },
  {
    icon: "symbols/sporesprite.png",
    label: "Spore",
    desc: "Special team rank: Spore."
  },
  {
    icon: "symbols/mushcapsprite.png",
    label: "Mushcap",
    desc: "Special team rank: Mushcap."
  },
  {
    icon: "symbols/shinyshroomsprite.png",
    label: "Shiny Shroom",
    desc: "Special team rank: Shiny Shroom."
  }
];

const POKEMON_ICONS = [
  {
    icon: "symbols/secretshinysprite.png",
    label: "Secret Shiny",
    desc: "Obtained as a secret shiny encounter."
  },
  {
    icon: "symbols/eventsprite.png",
    label: "Event Shiny",
    desc: "Caught during a special event."
  },
  {
    icon: "symbols/safarisprite.png",
    label: "Safari Shiny",
    desc: "Caught in the Safari Zone."
  },
  {
    icon: "symbols/clipsprite.png",
    label: "Clip/Video",
    desc: "Has a video or clip attached."
  },
  {
    icon: "symbols/eggsprite.png",
    label: "Hatched from Egg",
    desc: "Shiny Pokémon obtained via egg hatching."
  },
  {
    icon: "symbols/alphasprite.png",
    label: "Alpha Shiny",
    desc: "Caught as an Alpha Shiny."
  }
];

// --- TOOLTIP RENDERER ---
function renderIconLegendTooltip(icons) {
  return `
    <div class="icon-help-tooltip-box" tabindex="-1">
      <div class="icon-tooltip-title">Card Icon Legend</div>
      <div class="icon-tooltip-list">
        ${icons.map(icon => `
          <div class="icon-row">
            <img class="symbol" src="${icon.icon}" alt="${icon.label}" />
            <div class="icon-meta">
              <span class="icon-label">${icon.label}</span>
              <span class="icon-desc">${icon.desc}</span>
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

// --- REMOVE TOOLTIP ON PAGE CHANGE ---
function removeMemberShowcaseIconTooltip() {
  const old = document.querySelector('.member-showcase-icon-tooltip');
  if (old) old.remove();
}

// --- MEMBER SHOWCASE: Tooltip (Pokémon icons only), not too high ---
function addMemberShowcaseIconTooltip() {
  removeMemberShowcaseIconTooltip();
  let wrapper = document.createElement("span");
  wrapper.className = "icon-help-tooltip member-showcase-icon-tooltip";
  wrapper.tabIndex = 0;
  wrapper.innerHTML = `
    <span class="icon-help">[?]</span>
    ${renderIconLegendTooltip(POKEMON_ICONS)}
  `;
  document.body.appendChild(wrapper);

  function updatePosition() {
    const nav = document.querySelector('.nav');
    let navBottom = 0;
    if (nav) {
      const rect = nav.getBoundingClientRect();
      navBottom = rect.bottom + window.scrollY;
    } else {
      navBottom = 90;
    }
    wrapper.style.position = "fixed";
    wrapper.style.top = (navBottom + 12) + "px";
    wrapper.style.right = "1.7em";
    wrapper.style.zIndex = 2100;
  }
  updatePosition();
  window.addEventListener('resize', updatePosition);
  window.addEventListener('scroll', updatePosition);

  // Accessibility
  const box = wrapper.querySelector('.icon-help-tooltip-box');
  wrapper.addEventListener('mouseenter', () => { box.style.visibility = "visible"; box.style.opacity = "1"; });
  wrapper.addEventListener('mouseleave', () => { box.style.visibility = ""; box.style.opacity = ""; });
  wrapper.addEventListener('focusin', () => { box.style.visibility = "visible"; box.style.opacity = "1"; });
  wrapper.addEventListener('focusout', () => { box.style.visibility = ""; box.style.opacity = ""; });
}

// --- MAIN PAGE SEARCH CONTROLS (Donator/Member icons only) ---
function renderShowcaseSearchControls() {
  return `
    <div class="showcase-search-controls">
      <input type="text" id="showcase-search-input" placeholder="Search Pokémon or OT..." autocomplete="off" spellcheck="false" />
      <label for="showcase-sort-select">Sort by:</label>
      <select id="showcase-sort-select">
        <option value="alphabetical">A → Z</option>
        <option value="caught">Caught Date</option>
        <option value="rarity">Rarity</option>
        <option value="recent">Recently Added</option>
        <option value="count">Count</option>
      </select>
      <span class="icon-help-tooltip mainpage-tooltip" tabindex="0">
        <span class="icon-help">[?]</span>
        ${renderIconLegendTooltip(DONATOR_MEMBER_ICONS)}
      </span>
    </div>
  `;
}

// --- TEAM MEMBER HELPERS ---
window.buildTeamMembers = function() {
  window.teamMembers = (window.teamShowcase || []).map(entry => ({
    name: entry.name,
    shinies: Array.isArray(entry.shinies)
      ? entry.shinies.filter(mon => !mon.lost).length
      : 0,
    status: entry.status
  }));
};
if (window.teamShowcase) window.buildTeamMembers();

function shinyGifUrl(name) {
  let urlName = name
    .toLowerCase()
    .replace(/♀/g, "-f")
    .replace(/♂/g, "-m")
    .replace(/[\s.'’]/g, "");
  return `https://img.pokemondb.net/sprites/black-white/anim/shiny/${urlName}.gif`;
}

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

function getMemberSpriteUrls(memberName) {
  const base = memberName.toLowerCase().replace(/\s+/g, '');
  return [
    `membersprites/${base}sprite.png`,
    `membersprites/${base}sprite.jpg`,
    `membersprites/${base}sprite.gif`
  ];
}

function getPointsForPokemon(name, extra = {}) {
  if (!window.POKEMON_POINTS && window.buildPokemonPoints) window.buildPokemonPoints();
  if (!window.POKEMON_POINTS) return 1;

  let normName = name
    .toLowerCase()
    .replace(/♀/g, "-f")
    .replace(/♂/g, "-m")
    .replace(/[\s.'’]/g, "");
  let basePoints = window.POKEMON_POINTS[normName] || 1;
  if (extra.alpha) return 50;
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
    }
    if (!window._tier01set.has(normName)) return 20;
  }
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

function cleanPokemonName(name) {
  let cleaned = name
    .replace(/-(f|m|red-striped|blue-striped|east|west|galar|alola|hisui|paldea|mega|gigantamax|therian|origin|sky|dawn|midnight|midday|school|solo|rainy|sunny|snowy|attack|defense|speed|wash|heat|fan|frost|mow|midnight|midday|dusk|baile|pom-pom|pa'u|sensu|starter|battle-bond|ash|crowned|eternamax|gmax|complete|single-strike|rapid-strike)[^a-z0-9]*$/i, '')
    .replace(/-/g, ' ')
    .replace(/\s+/, ' ')
    .trim();
  cleaned = cleaned.replace(/\b\w/g, l => l.toUpperCase());
  return cleaned;
}

window.rebuildTier01Set = function() {
  window._tier01set = null;
};

// --- GROUPING ---
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

// --- RENDER SHOWCASE GALLERY ---
function renderShowcaseGallery(members, container, groupMode) {
  removeMemberShowcaseIconTooltip();
  if (!container) container = document.getElementById('showcase-gallery-container');
  container.innerHTML = "";

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

  let grouped;
  if (groupMode === "scoreboard") {
    grouped = groupMembersByPoints(members);
  } else if (groupMode === "shinies") {
    grouped = groupMembersByShinies(members);
  } else {
    grouped = groupMembersAlphabetically(members);
  }

  grouped.forEach(group => {
    const header = document.createElement('div');
    header.className = "showcase-category-header";
    header.textContent = group.header + (groupMode === "scoreboard" ? " Points" : "");
    container.appendChild(header);

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
        cardType: "member",
        memberStatus: member.status
      });
    });

    container.appendChild(gallery);
  });

  setTimeout(() => {
    container.querySelectorAll('.unified-card').forEach(card => {
      card.style.cursor = 'pointer';
      card.onclick = function (e) {
        if (window.getSelection && window.getSelection().toString()) return;
        const cardType = card.getAttribute('data-card-type');
        const cardName = card.getAttribute('data-name');
        if (cardType === "member") {
          const sortSelect = document.querySelector('.showcase-search-controls select');
          const sortMode = (sortSelect && sortSelect.value) || "alphabetical";
          location.hash = `#showcase-${cardName}?sort=${sortMode}`;
        }
      };
    });

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

// --- MEMBER SHOWCASE PAGE ---
function renderMemberShowcase(member, sortMode = "alphabetical") {
  removeMemberShowcaseIconTooltip();
  const content = document.getElementById('page-content');
  const shinies = getMemberShinies(member);
  const showcaseEntry = (window.teamShowcase || []).find(m => m.name === member.name);

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
        let extra = (showcaseEntry && showcaseEntry.shinies && showcaseEntry.shinies[i]) || {};
        const hasClip = typeof extra.clip === "string" && extra.clip.trim().length > 0;
        const monPoints = getPointsForPokemon(mon.name, extra);
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

  // Show the icon legend tooltip for Pokémon icons in the top right (below nav!)
  addMemberShowcaseIconTooltip();

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
window.setupShowcaseSearchAndSort = function(teamMembers, renderShowcaseGallery, initialSortMode) {
  removeMemberShowcaseIconTooltip();
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

  // Add the main page [?] icon legend tooltip
  const iconLegend = document.createElement('span');
  iconLegend.className = "icon-help-tooltip mainpage-tooltip";
  iconLegend.tabIndex = 0;
  iconLegend.innerHTML = `
    <span class="icon-help">[?]</span>
    ${renderIconLegendTooltip(DONATOR_MEMBER_ICONS)}
  `;
  controls.appendChild(iconLegend);

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

// --- Ensure teamMembers is built whenever teamShowcase is available ---
if (!window.teamMembers && window.teamShowcase) window.buildTeamMembers();
