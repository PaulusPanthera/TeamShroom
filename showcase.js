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
        ${icons.map(
          icon =>
            `<div class="icon-row">
              <img class="symbol" src="${icon.icon}" alt="${icon.label}" />
              <div class="icon-meta">
                <span class="icon-label">${icon.label}</span>
                <span class="icon-desc">${icon.desc}</span>
              </div>
            </div>`
        ).join("")}
      </div>
    </div>
  `;
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

// --- MEMBER SHOWCASE: Tooltip (Pokémon icons only), not too high ---

function addMemberShowcaseIconTooltip() {
  // Remove any existing
  let old = document.querySelector('.member-showcase-icon-tooltip');
  if (old) old.remove();

  let wrapper = document.createElement("span");
  wrapper.className = "icon-help-tooltip member-showcase-icon-tooltip";
  wrapper.tabIndex = 0;
  wrapper.innerHTML = `
    <span class="icon-help">[?]</span>
    ${renderIconLegendTooltip(POKEMON_ICONS)}
  `;
  document.body.appendChild(wrapper);

  // Position below nav, not absolute top right
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
    wrapper.style.top = (navBottom + 18) + "px";
    wrapper.style.right = "1.7em";
    wrapper.style.zIndex = 2100;
  }
  updatePosition();
  window.addEventListener('resize', updatePosition);
  window.addEventListener('scroll', updatePosition);

  // Focus/hover for accessibility
  const box = wrapper.querySelector('.icon-help-tooltip-box');
  wrapper.addEventListener('mouseenter', () => { box.style.visibility = "visible"; box.style.opacity = "1"; });
  wrapper.addEventListener('mouseleave', () => { box.style.visibility = ""; box.style.opacity = ""; });
  wrapper.addEventListener('focusin', () => { box.style.visibility = "visible"; box.style.opacity = "1"; });
  wrapper.addEventListener('focusout', () => { box.style.visibility = ""; box.style.opacity = ""; });
}

// --- SHOWCASE PAGE LOGIC ---

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

// ... (other helpers: getPointsForPokemon, getMemberScoreboardPoints, cleanPokemonName, grouping, etc.) ...

// --- MEMBER SHOWCASE PAGE ---

function renderMemberShowcase(member, sortMode = "alphabetical") {
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
