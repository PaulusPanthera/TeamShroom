// unifiedcard.js
// Renders a unified card for Pokémon/member with icon slots

export function renderUnifiedCard({
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
  // --- ICON PATHS (all paths must start with img/symbols/) ---
  const statusIconMap = {
    spore: "img/symbols/sporesprite.png",
    shroom: "img/symbols/shroomsprite.png",
    shinyshroom: "img/symbols/shinyshroomsprite.png",
    mushcap: "img/symbols/mushcapsprite.png"
  };
  const donatorIconMap = {
    bronze: "img/symbols/bronzedonatorsprite.png",
    silver: "img/symbols/silverdonatorsprite.png",
    gold: "img/symbols/golddonatorsprite.png",
    platinum: "img/symbols/platinumdonatorsprite.png",
    diamond: "img/symbols/diamonddonatorsprite.png",
    top: "img/symbols/topdonatorsprite.png"
  };
  const statusIcon = memberStatus && statusIconMap[memberStatus] ? statusIconMap[memberStatus] : "";
  const donatorIcon = donatorStatus && donatorIconMap[donatorStatus] ? donatorIconMap[donatorStatus] : "";

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
        ${symbols.secret ? `<img class="symbol secret" src="img/symbols/secretshinysprite.png" title="Secret" alt="Secret">` : ""}
        ${symbols.event ? `<img class="symbol event" src="img/symbols/eventsprite.png" title="Event" alt="Event">` : ""}
        ${symbols.safari ? `<img class="symbol safari" src="img/symbols/safarisprite.png" title="Safari" alt="Safari">` : ""}
        ${symbols.clip ? `<img class="symbol clip" src="img/symbols/clipsprite.png" title="Clip" alt="Clip">` : ""}
        ${symbols.egg ? `<img class="symbol egg" src="img/symbols/eggsprite.png" title="Egg" alt="Egg">` : ""}
        ${symbols.alpha ? `<img class="symbol alpha" src="img/symbols/alphasprite.png" title="Alpha" alt="Alpha">` : ""}
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

  return `
    <div ${cardAttributes}>
      ${symbolsHtml}
      <span class="${nameClass}">${name}</span>
      <img class="unified-img" src="${img}" alt="${name}">
      <span class="unified-info${lost ? ' lost' : ''}">${info || ""}</span>
    </div>
  `;
}
