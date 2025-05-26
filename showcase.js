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

// Placeholder sprite for all members
const placeholderSprite = "examplesprite.gif";

// For demo, fake shiny list (replace with real data when available)
function getMemberShinies(member) {
  // Returns an array of 1...n "shiny" placeholder gifs per member
  return Array.from({ length: member.shinies }, () => placeholderSprite);
}

// Main gallery rendering
function renderShowcaseGallery(members) {
  const content = document.getElementById('page-content');
  content.innerHTML = `<h1>Shiny Showcase</h1>
    <div class="showcase-gallery"></div>
  `;

  const gallery = content.querySelector(".showcase-gallery");
  gallery.style.display = "grid";
  gallery.style.gridTemplateColumns = "repeat(auto-fit, minmax(180px, 1fr))";
  gallery.style.gap = "1.5rem";

  members.forEach(member => {
    const entry = document.createElement("div");
    entry.className = "showcase-entry";
    entry.innerHTML = `
      <div class="showcase-name">${member.name}</div>
      <img src="${placeholderSprite}" class="showcase-sprite" style="width:64px; height:64px; cursor:pointer;" alt="${member.name}" data-member="${member.name}">
      <div class="showcase-shiny-count">Shinies: ${member.shinies}</div>
    `;
    // Clickable sprite links to member-specific showcase
    entry.querySelector(".showcase-sprite").onclick = e => {
      location.hash = "#showcase-" + member.name;
    };
    gallery.appendChild(entry);
  });
}

// Individual member's shiny showcase
function renderMemberShowcase(member) {
  const content = document.getElementById('page-content');
  content.innerHTML = `
    <button onclick="history.back()" style="margin-bottom:1em">← Back</button>
    <h1>${member.name}'s Shiny Showcase</h1>
    <div>Shinies: ${member.shinies}</div>
    <div class="showcase-shinies" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:1em;">
      ${getMemberShinies(member).map(gif =>
        `<img src="${gif}" alt="shiny" class="showcase-shiny-img" style="width:48px;height:48px;image-rendering:pixelated;">`
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
