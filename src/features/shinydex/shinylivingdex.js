// v2.0.0-alpha.1
// src/features/shinydex/shinylivingdex.js
// Shiny Living Dex — species ownership snapshot
// Render-only. No state. No side effects beyond DOM created in-container.

import { renderUnifiedCard } from '../../ui/unifiedcard.js';
import { prettifyPokemonName } from '../../utils/utils.js';
import {
  POKEMON_SHOW,
  POKEMON_REGION
} from '../../data/pokemondatabuilder.js';
import { buildShinyLivingDexModel } from '../../domains/shinydex/livingdex.model.js';

function getPokemonGif(key) {
  return 'https://img.pokemondb.net/sprites/black-white/anim/shiny/' + key + '.gif';
}

function ensureOwnerTooltip() {
  var existing = document.getElementById('dex-owner-tooltip');
  if (existing) existing.remove();

  var tip = document.createElement('div');
  tip.id = 'dex-owner-tooltip';
  tip.className = 'dex-owner-tooltip';

  tip.innerHTML = [
    '<div class="owners-title"></div>',
    '<div class="owners-list"><div class="scrolling-names"></div></div>'
  ].join('');

  document.body.appendChild(tip);
  return tip;
}

function setTooltipContent(tip, pokemonName, owners) {
  var title = tip.querySelector('.owners-title');
  var scrolling = tip.querySelector('.scrolling-names');

  title.textContent = 'Owners — ' + pokemonName;

  var list = Array.isArray(owners) ? owners.slice() : [];
  if (!list.length) list = ['None'];

  // dedupe + stable display
  var seen = {};
  var out = [];
  for (var i = 0; i < list.length; i++) {
    var n = String(list[i] || '').trim();
    if (!n) continue;
    var k = n.toLowerCase();
    if (seen[k]) continue;
    seen[k] = true;
    out.push(n);
  }
  if (!out.length) out = ['None'];

  scrolling.textContent = out.join('\n');

  // slower for large lists: 12s base + 0.6s per name, capped
  var dur = Math.min(36, Math.max(12, 12 + out.length * 0.6));
  scrolling.style.animationDuration = dur + 's';
}

function positionTooltip(tip, x, y) {
  var pad = 14;
  var w = tip.offsetWidth || 320;
  var h = tip.offsetHeight || 140;

  var left = x + pad;
  var top = y + pad;

  var maxLeft = window.innerWidth - w - pad;
  var maxTop = window.innerHeight - h - pad;

  if (left > maxLeft) left = x - w - pad;
  if (top > maxTop) top = y - h - pad;

  tip.style.left = left + 'px';
  tip.style.top = top + 'px';
}

export function renderShinyLivingDex(args) {
  var showcaseRows = args.showcaseRows;
  var search = args.search;
  var unclaimedOnly = args.unclaimedOnly;
  var sort = args.sort;
  var countLabel = args.countLabel;

  var container = document.getElementById('shiny-dex-container');
  container.innerHTML = '';

  var tip = ensureOwnerTooltip();

  var dex = buildShinyLivingDexModel(showcaseRows).filter(function (e) {
    return POKEMON_SHOW[e.pokemon] !== false;
  });

  if (search) {
    dex = dex.filter(function (e) {
      return prettifyPokemonName(e.pokemon).toLowerCase().indexOf(search) !== -1;
    });
  }

  if (unclaimedOnly) {
    dex = dex.filter(function (e) { return e.count === 0; });
  }

  if (sort === 'total') {
    dex.sort(function (a, b) { return b.count - a.count; });
  }

  var byRegion = {};
  for (var i = 0; i < dex.length; i++) {
    var entry = dex[i];
    var region = POKEMON_REGION[entry.pokemon] || 'unknown';
    if (!byRegion[region]) byRegion[region] = [];
    byRegion[region].push(entry);
  }

  var totalSpecies = 0;
  var ownedSpecies = 0;

  Object.entries(byRegion).forEach(function (pair) {
    var region = pair[0];
    var entries = pair[1];

    var section = document.createElement('section');
    section.className = 'region-section';

    var total = entries.length;
    var owned = entries.filter(function (e) { return e.count > 0; }).length;

    totalSpecies += total;
    ownedSpecies += owned;

    var header = document.createElement('h2');
    header.textContent = region.toUpperCase() + ' (' + owned + ' / ' + total + ')';

    var grid = document.createElement('div');
    grid.className = 'dex-grid';

    entries.forEach(function (entry) {
      var wrap = document.createElement('div');
      wrap.innerHTML = renderUnifiedCard({
        name: prettifyPokemonName(entry.pokemon),
        img: getPokemonGif(entry.pokemon),
        info:
          entry.count === 0
            ? 'Unowned'
            : entry.count === 1
              ? '1 Shiny'
              : entry.count + ' Shinies',
        unclaimed: entry.count === 0,
        highlighted: entry.count > 0,
        cardType: 'pokemon'
      }).trim();

      var card = wrap.firstElementChild;
      card.setAttribute('data-pokemon-key', entry.pokemon);

      card.addEventListener('mouseenter', function (ev) {
        var key = this.getAttribute('data-pokemon-key');
        var found = entries.find(function (x) { return x.pokemon === key; });
        var owners = found ? found.owners : [];
        setTooltipContent(tip, prettifyPokemonName(key), owners);
        tip.classList.add('show');
        positionTooltip(tip, ev.clientX, ev.clientY);
      });

      card.addEventListener('mousemove', function (ev) {
        if (!tip.classList.contains('show')) return;
        positionTooltip(tip, ev.clientX, ev.clientY);
      });

      card.addEventListener('mouseleave', function () {
        tip.classList.remove('show');
      });

      grid.appendChild(card);
    });

    section.appendChild(header);
    section.appendChild(grid);
    container.appendChild(section);
  });

  countLabel.textContent = ownedSpecies + ' / ' + totalSpecies + ' Owned';
}
