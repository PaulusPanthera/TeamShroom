// v2.0.0-alpha.1
// src/features/shinydex/shinylivingdex.js
// Living Dex Renderer — DOM only

import { renderUnifiedCard } from '../../ui/unifiedcard.js';
import { prettifyPokemonName } from '../../utils/utils.js';
import { prepareLivingDexRenderModel } from './shinydex.livingdex.presenter.js';

function spriteKey(pokemonKey) {
  var k = String(pokemonKey || '').toLowerCase();

  // CORB-fix: ensure pokemondb keys are correct
  if (k === 'mrmime') return 'mr-mime';
  if (k === 'mimejr') return 'mime-jr';
  if (k === 'typenull') return 'type-null';
  if (k === 'porygonz') return 'porygon-z';

  return k;
}

function getPokemonGif(key) {
  return 'https://img.pokemondb.net/sprites/black-white/anim/shiny/' + spriteKey(key) + '.gif';
}

function escapeAttr(str) {
  return String(str || '').replace(/"/g, '&quot;');
}

export function renderShinyLivingDex(opts) {
  var showcaseRows = opts && opts.showcaseRows;
  var viewState = opts && opts.viewState;
  var searchCtx = opts && opts.searchCtx;
  var countLabel = opts && opts.countLabel;

  var container = document.getElementById('shiny-dex-container');
  container.innerHTML = '';

  var model = prepareLivingDexRenderModel({
    showcaseRows: showcaseRows,
    viewState: viewState,
    searchCtx: searchCtx
  });

  if (countLabel) countLabel.textContent = model.countLabelText;

  for (var r = 0; r < model.sections.length; r++) {
    var regionSec = model.sections[r];

    var section = document.createElement('section');
    section.className = 'region-section';

    var header = document.createElement('h2');
    header.textContent = regionSec.title;

    var grid = document.createElement('div');
    grid.className = 'dex-grid';

    for (var i = 0; i < regionSec.entries.length; i++) {
      var entry = regionSec.entries[i];

      var ownedCount = Number(entry.count) || 0;
      var info = ownedCount === 0 ? 'Unowned' : (ownedCount === 1 ? '1 Shiny' : (ownedCount + ' Shinies'));

      var owners = entry.ownersUnique || [];
      var ownersRaw = owners.join('|');

      // wrapper keeps unified-card hard-contract intact
      var cardHtml = renderUnifiedCard({
        name: prettifyPokemonName(entry.pokemon),
        img: getPokemonGif(entry.pokemon),
        info: info,
        unclaimed: ownedCount === 0,
        highlighted: ownedCount > 0,
        cardType: 'pokemon'
      });

      grid.insertAdjacentHTML(
        'beforeend',
        '<div class="dex-card-wrap" data-pokemon-name="' + escapeAttr(prettifyPokemonName(entry.pokemon)) + '" data-owners="' + escapeAttr(ownersRaw) + '">' +
          cardHtml +
        '</div>'
      );
    }

    section.appendChild(header);
    section.appendChild(grid);
    container.appendChild(section);
  }
}
