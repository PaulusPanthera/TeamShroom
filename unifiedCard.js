// unifiedCard.js
// Shared card renderer for all modules, now with optional symbol overlays for showcase shinies

window.renderUnifiedCard = function(opts) {
  // opts: { name, img, info, lost, unclaimed, cardType, symbols, clip }
  let nameClass = "unified-name";
  if (opts.name.length > 16 && opts.name.length <= 22) {
    nameClass += " long-name";
  } else if (opts.name.length > 22) {
    nameClass += " very-long-name";
  }
  const cardType = opts.cardType || "member";
  const dataName = String(opts.name).replace(/"/g, "&quot;");

  // Symbol overlay logic (only for showcase with .symbols property)
  let symbolOverlay = "";
  const s = opts.symbols || {};
  if (s && Object.values(s).some(Boolean)) {
    symbolOverlay = `
      <div class="symbol-overlay">
        ${s.secret ? `<img class="symbol secret" src="symbols/secretshinysprite.png" title="Secret Shiny">` : ""}
        ${s.egg ? `<img class="symbol egg" src="symbols/eggsprite.png" title="Egg">` : ""}
        ${s.safari ? `<img class="symbol safari" src="symbols/safarisprite.png" title="Safari">` : ""}
        ${s.event ? `<img class="symbol event" src="symbols/eventsprite.png" title="Event">` : ""}
        ${s.alpha ? `<img class="symbol alpha" src="symbols/alphasprite.png" title="Alpha">` : ""}
        ${s.clip ? `<img class="symbol clip" src="symbols/clipsprite.png" title="Clip">` : ""}
      </div>
    `;
  }

  // If there's a clip link, add data-clip attribute
  const dataClip = opts.clip ? ` data-clip="${String(opts.clip).replace(/"/g, "&quot;")}"` : "";

  return `
    <div class="unified-card${opts.lost ? ' lost' : ''}${opts.unclaimed ? ' unclaimed' : ''}" 
         data-card-type="${cardType}" data-name="${dataName}"${dataClip}>
      ${symbolOverlay}
      <div class="${nameClass}">${opts.name}</div>
      <img src="${opts.img}" alt="${opts.name}" class="unified-img"${opts.lost ? ' style="opacity:0.6;filter:grayscale(1);"' : ""}>
      <div class="unified-info${opts.lost ? ' lost' : ''}">${opts.info}</div>
    </div>
  `;
};
