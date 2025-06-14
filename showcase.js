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

// Main gallery rendering (accepts groupMode: "alphabetical" or "shinies")
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
  if (groupMode === "shinies") {
    grouped = groupMembersByShinies(members);
  } else {
    grouped = groupMembersAlphabetically(members);
  }

  grouped.forEach(group => {
    const section = document.createElement("section");
    section.className = "showcase-letter-section";
    section.innerHTML = `<h2>${group.header}</h2>
      <div class="showcase-gallery"></div>
    `;
    const gallery = section.querySelector(".showcase-gallery");
    gallery.style.display = "grid";
    gallery.style.gridTemplateColumns = "repeat(6, 1fr)";
    gallery.style.gap = "1.5rem";

    group.members.forEach(member => {
      const spriteUrl = "examplesprite.gif"; // Replace with shinyGifUrl(member.name) if you want real sprites
      const entry = document.createElement("div");
      entry.className = "showcase-entry";
      entry.innerHTML = `
        <div class="showcase-name">${member.name}</div>
        <img src="${spriteUrl}" class="showcase-sprite" alt="${member.name}" data-member="${member.name}">
        <div class="showcase-shiny-count">Shinies: ${member.shinies}</div>
      `;
      entry.querySelector(".showcase-sprite").onclick = e => {
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
  content.innerHTML = `
    <button onclick="window.location.hash='#showcase?sort=${sortMode}'" style="margin-bottom:1em">← Back</button>
    <h1>${member.name}'s Shiny Showcase</h1>
    <div>Shinies: ${shinies.filter(mon => !mon.lost).length}</div>
    <div class="showcase-shinies" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:1em;">
      ${shinies.map(mon =>
        `<div class="showcase-shiny-img-wrapper${mon.lost ? ' lost' : ''}" style="width:120px;height:120px;">
          <img src="${mon.url}" alt="${mon.name}${mon.lost ? ' (lost)' : ''}" class="showcase-shiny-img${mon.lost ? ' lost' : ''}" style="width:120px;height:120px;image-rendering:pixelated;" title="${mon.name}${mon.lost ? ' (lost)' : ''}">
        </div>`
      ).join("")}
    </div>
  `;
}
