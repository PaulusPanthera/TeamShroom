// unifiedCard.js
// Renders a unified card for Pokémon/member with icon slots

// --- Add this mapping at the top (before renderUnifiedCard) ---
// Map Pokémon name to scale factor for animated GIFs or PNGs.
// Only add entries for outliers; default is 1.
const pokemonImgScales = {
  // Example: "Onix": 0.85, "Wailord": 0.75
  // Add entries for outlier Pokémon only if needed.
};

// Helper to get scale
function getPokemonImgScale(name) {
  return pokemonImgScales[name] || 1;
}

function renderUnifiedCard({
  name,
  img,
  info,
  unclaimed,
  lost,
  cardType,
  clip,
  symbols = {},
  memberStatus,
  donatorStatus
}) {
  const statusIconMap = {
    spore: "sporesprite.png",
    shroom: "shroomsprite.png",
    shinyshroom: "shinyshroomsprite.png",
    mushcap: "mushcapsprite.png"
  };
  const donatorIconMap = {
    bronze: "bronzedonatorsprite.png",
    silver: "silverdonatorsprite.png",
    gold: "golddonatorsprite.png",
    platinum: "platinumdonatorsprite.png",
    diamond: "diamonddonatorsprite.png",
    top: "topdonatorsprite.png"
  };
  const statusIcon = memberStatus && statusIconMap[memberStatus] ? `symbols/${statusIconMap[memberStatus]}` : "";
  const donatorIcon = donatorStatus && donatorIconMap[donatorStatus] ? `symbols/${donatorIconMap[donatorStatus]}` : "";

  let cardClass = "unified-card";
  if (unclaimed) cardClass += " unclaimed";
  if (lost) cardClass += " lost";
  let cardAttributes = `class="${cardClass}" data-card-type="${cardType || ""}" data-name="${name.replace(/"/g, '&quot;')}"`;
  if (clip) cardAttributes += ` data-clip="${clip.replace(/"/g, '&quot;')}"`;

  // Build all icons that need to be rendered for this card
  let symbolsHtml = "";

  if (cardType === "pokemon") {
    symbolsHtml = `
  <div class="symbol-overlay">
    ${symbols.secret ? `<img class="symbol secret" src="symbols/secretshinysprite.png" title="Secret" alt="Secret">` : ""}
    ${symbols.event ? `<img class="symbol event" src="symbols/eventsprite.png" title="Event" alt="Event">` : ""}
    ${symbols.safari ? `<img class="symbol safari" src="symbols/safarisprite.png" title="Safari" alt="Safari">` : ""}
    ${symbols.clip ? `<img class="symbol clip" src="symbols/clipsprite.png" title="Clip" alt="Clip">` : ""}
    ${symbols.egg ? `<img class="symbol egg" src="symbols/eggsprite.png" title="Egg" alt="Egg">` : ""}
    ${symbols.alpha ? `<img class="symbol alpha" src="symbols/alphasprite.png" title="Alpha" alt="Alpha">` : ""}
  </div>
`;
  } else if (cardType === "member" && (statusIcon || donatorIcon)) {
    symbolsHtml = `
      <div class="symbol-overlay">
        ${statusIcon ? `<img class="symbol member-status" src="${statusIcon}" alt="Member Status">` : ""}
        ${donatorIcon ? `<img class="symbol donator-status" src="${donatorIcon}" alt="Donator Status">` : ""}
      </div>
    `;
  }

  // Name class for truncation
  let nameClass = "unified-name";
  if (name.length > 13) nameClass += " long-name";
  if (name.length > 16) nameClass += " very-long-name";

  // No scaling: revert to just standard .unified-img!
  return `
    <div ${cardAttributes}>
      ${symbolsHtml}
      <span class="${nameClass}">${name}</span>
      <img class="unified-img" src="${img}" alt="${name}">
      <span class="unified-info${lost ? ' lost' : ''}">${info || ""}</span>
    </div>
  `;
}
