// showcase.js

// Team Shroom members and their shiny counts
const teamMembers = [
  { name: "ANNlLlATION", shinies: 1 },
  { name: "ashash", shinies: 3 },
  { name: "BlistiK", shinies: 12 },
  { name: "BojanglesisHere", shinies: 13 },
  { name: "Brokencycles", shinies: 2 },
  { name: "Bulkanator", shinies: 10 },
  { name: "casethecase", shinies: 5 },
  { name: "cgrtmlk", shinies: 2 },
  { name: "CheesasaurusRex", shinies: 6 },
  { name: "ChimpExc", shinies: 2 },
  { name: "Chucklesworth", shinies: 2 },
  { name: "clairofan", shinies: 15 },
  { name: "Cometsan", shinies: 6 },
  { name: "CraazyHorse", shinies: 10 },
  { name: "DaddyMolo", shinies: 21 },
  { name: "DamoNll", shinies: 7 },
  { name: "Difoolioo", shinies: 4 },
  { name: "Draind", shinies: 16 },
  { name: "Eerierie", shinies: 13 },
  { name: "ElMannun", shinies: 3 },
  { name: "FrostyIceScream", shinies: 13 },
  { name: "Geranxx", shinies: 4 },
  { name: "Glizcor", shinies: 13 },
  { name: "Grayzxv", shinies: 2 },
  { name: "Grrzzly", shinies: 9 },
  { name: "GTGxR", shinies: 13 },
  { name: "Gumbasketball", shinies: 12 },
  { name: "Highschoolme", shinies: 2 },
  { name: "Hjordi", shinies: 16 },
  { name: "iMonchi", shinies: 1 },
  { name: "Instintooo", shinies: 1 },
  { name: "itsEasy", shinies: 6 },
  { name: "ItsKitas", shinies: 6 },
  { name: "Jaspn", shinies: 16 },
  { name: "Jayyxxi", shinies: 2 },
  { name: "Jeakama", shinies: 7 },
  { name: "Jennling", shinies: 2 },
  { name: "JGrenade", shinies: 4 },
  { name: "Johnerrr", shinies: 12 },
  { name: "JulieJewel", shinies: 13 },
  { name: "Jutskaa", shinies: 24 },
  { name: "KBritoBM", shinies: 3 },
  { name: "kitsucupid", shinies: 5 },
  { name: "KrikaDoce", shinies: 6 },
  { name: "LoDarko", shinies: 5 },
  { name: "LordGangis", shinies: 20 },
  { name: "Loundemon", shinies: 9 },
  { name: "lucaswatko", shinies: 4 },
  { name: "LunaLost", shinies: 30 },
  { name: "Macarene", shinies: 1 },
  { name: "maknaez", shinies: 39 },
  { name: "mbarren", shinies: 16 },
  { name: "MechanicalHippo", shinies: 8 },
  { name: "MELVZZY", shinies: 16 },
  { name: "MikeRunkZz", shinies: 18 },
  { name: "Minatoway", shinies: 5 },
  { name: "MitchOsu", shinies: 3 },
  { name: "mossballetje", shinies: 2 },
  { name: "MrChooch", shinies: 3 },
  { name: "MrJawster", shinies: 2 },
  { name: "MrsJawster", shinies: 6 },
  { name: "nerfviands", shinies: 1 },
  { name: "Nercylla", shinies: 6 },
  { name: "NSxPRODIGY", shinies: 3 },
  { name: "OrllandoV", shinies: 20 },
  { name: "PaulusTFT", shinies: 24 },
  { name: "peachhteaa", shinies: 1 },
  { name: "pearishx", shinies: 8 },
  { name: "pitcheronly", shinies: 2 },
  { name: "PokeBodega", shinies: 11 },
  { name: "Prttyflxcko", shinies: 4 },
  { name: "qtAlice", shinies: 21 },
  { name: "Qubuu", shinies: 9 },
  { name: "QuinJay", shinies: 1 },
  { name: "realjuckpop", shinies: 2 },
  { name: "RicRiley", shinies: 1 },
  { name: "Rintuu", shinies: 1 },
  { name: "RuthlessZ", shinies: 11 },
  { name: "SecretSlowshiny", shinies: 5 },
  { name: "Serako", shinies: 9 },
  { name: "ShakeyEy", shinies: 12 },
  { name: "ShinishilE", shinies: 1 },
  { name: "SilverGale", shinies: 4 },
  { name: "Sirbeyy", shinies: 8 },
  { name: "SmiigZ", shinies: 11 },
  { name: "SplaxxLIVE", shinies: 1 },
  { name: "Splinterbrained", shinies: 5 },
  { name: "srysu", shinies: 31 },
  { name: "SubSpacePet", shinies: 4 },
  { name: "SushiWhopperK", shinies: 6 },
  { name: "tardigreat", shinies: 2 },
  { name: "TerminusDT", shinies: 6 },
  { name: "TheJuanNonly", shinies: 11 },
  { name: "TheStahlBayBay", shinies: 2 },
  { name: "TorontoKid", shinies: 22 },
  { name: "Tortuponchy", shinies: 2 },
  { name: "TTVxSenseiNESS", shinies: 18 },
  { name: "tulicreme", shinies: 5 },
  { name: "TzKalZuk", shinies: 2 },
  { name: "UltraKingRom", shinies: 1 },
  { name: "Unesha", shinies: 1 },
  { name: "WhosWill", shinies: 6 },
  { name: "WillyPS", shinies: 36 },
  { name: "WinterIvy", shinies: 1 },
  { name: "Wisqi", shinies: 10 },
  { name: "xMileage", shinies: 2 },
  { name: "xRaiketsu", shinies: 5 },
  { name: "XxEmperiorxX", shinies: 27 },
  { name: "Yoyoyoshie", shinies: 3 },
  { name: "ZiaStitch", shinies: 8 }
];

// Helper to generate the correct shiny gif url
function shinyGifUrl(name) {
  // Normalize name for the URL
  let urlName = name
    .toLowerCase()
    .replace(/[\s.]/g, "-") // spaces/dots to dash
    .replace(/-f$/, "-f")   // female/male forms
    .replace(/-m$/, "-m");
  return `https://img.pokemondb.net/sprites/black-white/anim/shiny/${urlName}.gif`;
}

// Get the actual shinies for a member using teamShowcase
function getMemberShinies(member) {
  if (!window.teamShowcase) {
    // Fallback in case teamShowcase is not loaded
    return Array.from({ length: member.shinies }, () => ({
      name: "Placeholder",
      url: "examplesprite.gif",
      lost: false
    }));
  }
  const showcaseEntry = teamShowcase.find(m => m.name === member.name);
  if (!showcaseEntry) {
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

// Group members alphabetically
function groupMembersAlphabetically(members) {
  const grouped = {};
  members.forEach(member => {
    const firstLetter = member.name[0].toUpperCase();
    if (!grouped[firstLetter]) grouped[firstLetter] = [];
    grouped[firstLetter].push(member);
  });
  // Sort group keys and each group alphabetically
  return Object.keys(grouped).sort().map(letter => ({
    letter,
    members: grouped[letter].sort((a, b) => a.name.localeCompare(b.name))
  }));
}

// Main gallery rendering (6 columns, alphabetically grouped)
function renderShowcaseGallery(members) {
  const content = document.getElementById('page-content');
  content.innerHTML = `<h1>Shiny Showcase</h1>
    <div class="showcase-alphabetical"></div>
  `;

  const alphaContainer = content.querySelector(".showcase-alphabetical");
  const grouped = groupMembersAlphabetically(members);

  grouped.forEach(group => {
    // Section header
    const section = document.createElement("section");
    section.className = "showcase-letter-section";
    section.innerHTML = `<h2>${group.letter}</h2>
      <div class="showcase-gallery"></div>
    `;
    const gallery = section.querySelector(".showcase-gallery");
    gallery.style.display = "grid";
    gallery.style.gridTemplateColumns = "repeat(6, 1fr)";
    gallery.style.gap = "1.5rem";

    group.members.forEach(member => {
      // Always use the placeholder for the main gallery!
      const spriteUrl = "examplesprite.gif";
      const entry = document.createElement("div");
      entry.className = "showcase-entry";
      entry.innerHTML = `
        <div class="showcase-name">${member.name}</div>
        <img src="${spriteUrl}" class="showcase-sprite" alt="${member.name}" data-member="${member.name}">
        <div class="showcase-shiny-count">Shinies: ${member.shinies}</div>
      `;
      entry.querySelector(".showcase-sprite").onclick = e => {
        location.hash = "#showcase-" + member.name;
      };
      gallery.appendChild(entry);
    });
    alphaContainer.appendChild(section);
  });
}

// Individual member's shiny showcase with wrapper for lost overlay X
function renderMemberShowcase(member) {
  const content = document.getElementById('page-content');
  const shinies = getMemberShinies(member);
  content.innerHTML = `
    <button onclick="history.back()" style="margin-bottom:1em">← Back</button>
    <h1>${member.name}'s Shiny Showcase</h1>
    <div>Shinies: ${shinies.length}</div>
    <div class="showcase-shinies" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:1em;">
      ${shinies.map(mon =>
        `<div class="showcase-shiny-img-wrapper${mon.lost ? ' lost' : ''}" style="width:120px;height:120px;">
          <img src="${mon.url}" alt="${mon.name}${mon.lost ? ' (lost)' : ''}" class="showcase-shiny-img${mon.lost ? ' lost' : ''}" style="width:120px;height:120px;image-rendering:pixelated;" title="${mon.name}${mon.lost ? ' (lost)' : ''}">
        </div>`
      ).join("")}
    </div>
  `;
}

// Routing logic (hash-based navigation)
window.onhashchange = function () {
  if (location.hash.startsWith("#showcase-")) {
    const name = decodeURIComponent(location.hash.replace("#showcase-", ""));
    const member = teamMembers.find(m => m.name === name);
    if (member) renderMemberShowcase(member);
  } else {
    renderShowcaseGallery(teamMembers);
  }
};

// Initial render
window.onload = () => renderShowcaseGallery(teamMembers);
