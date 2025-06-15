// unifiedCard.js
// Shared card renderer for all modules

window.renderUnifiedCard = function(opts) {
  // opts: { name, img, info, lost, unclaimed }
  let nameClass = "unified-name";
  if (opts.name.length > 16 && opts.name.length <= 22) {
    nameClass += " long-name";
  } else if (opts.name.length > 22) {
    nameClass += " very-long-name";
  }
  return `
    <div class="unified-card${opts.lost ? ' lost' : ''}${opts.unclaimed ? ' unclaimed' : ''}">
      <div class="${nameClass}">${opts.name}</div>
      <img src="${opts.img}" alt="${opts.name}" class="unified-img"${opts.lost ? ' style="opacity:0.6;filter:grayscale(1);"' : ""}>
      <div class="unified-info${opts.lost ? ' lost' : ''}">${opts.info}</div>
    </div>
  `;
};
