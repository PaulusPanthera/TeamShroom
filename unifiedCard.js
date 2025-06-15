// unifiedCard.js
// Shared card renderer for all modules

window.renderUnifiedCard = function(opts) {
  // opts: { name, img, info, lost, unclaimed, cardType }
  let nameClass = "unified-name";
  if (opts.name.length > 16 && opts.name.length <= 22) {
    nameClass += " long-name";
  } else if (opts.name.length > 22) {
    nameClass += " very-long-name";
  }
  // Use cardType, default to "member" if not given
  const cardType = opts.cardType || "member";
  // Sanitize data-name for attribute (no quotes)
  const dataName = String(opts.name).replace(/"/g, "&quot;");
  return `
    <div class="unified-card${opts.lost ? ' lost' : ''}${opts.unclaimed ? ' unclaimed' : ''}" 
         data-card-type="${cardType}" data-name="${dataName}">
      <div class="${nameClass}">${opts.name}</div>
      <img src="${opts.img}" alt="${opts.name}" class="unified-img"${opts.lost ? ' style="opacity:0.6;filter:grayscale(1);"' : ""}>
      <div class="unified-info${opts.lost ? ' lost' : ''}">${opts.info}</div>
    </div>
  `;
};
