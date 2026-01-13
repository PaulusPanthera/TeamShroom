// v2.0.0-alpha.1
// src/ui/unifiedcard.js
// Unified Card Renderer — HARD CONTRACT
// Structure and size are immutable

export function renderUnifiedCard(cfg) {
  cfg = cfg || {};

  var name = cfg.name;
  var img = cfg.img;
  var info = cfg.info || '';
  var cardType = cfg.cardType; // 'member' | 'pokemon'
  var unclaimed = !!cfg.unclaimed;
  var lost = !!cfg.lost;
  var highlighted = !!cfg.highlighted;
  var symbols = cfg.symbols || {};
  var clip = cfg.clip;
  var key = cfg.key;
  var owners = cfg.owners;

  var classes = [
    'unified-card',
    unclaimed && 'is-unclaimed',
    lost && 'is-lost',
    highlighted && 'is-highlighted'
  ].filter(Boolean).join(' ');

  var attributes =
    'class="' + classes + '" ' +
    'data-card-type="' + (cardType || '') + '" ' +
    'data-name="' + escapeAttr(name) + '"';

  if (key) {
    attributes += ' data-key="' + escapeAttr(key) + '"';
  }

  if (clip) {
    attributes += ' data-clip="' + escapeAttr(clip) + '"';
  }

  if (owners && Array.isArray(owners) && owners.length) {
    attributes += ' data-owners="' + escapeAttr(JSON.stringify(owners)) + '"';
  }

  var symbolMap = {
    secret: 'secretshinysprite.png',
    alpha: 'alphasprite.png',
    clip: 'clipsprite.png',

    mpb: 'mpbsprite.png',
    mgb: 'mgbsprite.png',
    mub: 'mubsprite.png',
    mcb: 'mcbsprite.png',
    mdb: 'mdbsprite.png',
    egg: 'eggsprite.png',
    safari: 'safarisprite.png',
    single: 'singlesprite.png',
    swarm: 'swarmsprite.png',
    raid: 'raidsprite.png',
    fishing: 'fishingsprite.png',
    headbutt: 'headbuttsprite.png',
    rocksmash: 'rocksmashsprite.png',
    honeytree: 'honeytreesprite.png',
    event: 'eventsprite.png'
  };

  var symbolHtml = Object.entries(symbols)
    .filter(function (pair) { return !!pair[1]; })
    .map(function (pair) {
      var k = pair[0];
      var file = symbolMap[k];
      if (!file) return '';
      return (
        '<img class="symbol ' + k + '" ' +
          'src="img/symbols/' + file + '" ' +
          'alt="' + k + '">' 
      );
    })
    .join('');

  var overlay = symbolHtml
    ? '<div class="symbol-overlay">' + symbolHtml + '</div>'
    : '';

  return (
    '<div ' + attributes + '>' +
      overlay +
      '<span class="unified-name">' + (name || '') + '</span>' +
      '<img class="unified-img" src="' + (img || '') + '" alt="' + (name || '') + '">' +
      '<span class="unified-info">' + (info || '') + '</span>' +
    '</div>'
  );
}

function escapeAttr(str) {
  return String(str).replace(/"/g, '&quot;');
}
