// v2.0.0-alpha.1
// src/features/shinydex/shinydex.hitlist.js
// Hitlist Renderer — DOM only

import { renderUnifiedCard } from '../../ui/unifiedcard.js';
import { prettifyPokemonName } from '../../utils/utils.js';
import { prepareHitlistRenderModel } from './shinydex.hitlist.presenter.js';

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

export function renderShinyDexHitlist(opts) {
  var weeklyModel = opts && opts.weeklyModel;
  var viewState = opts && opts.viewState;
  var searchCtx = opts && opts.searchCtx;
  var countLabel = opts && opts.countLabel;

  var container = document.getElementById('shiny-dex-container');
  container.innerHTML = '';

  var model = prepareHitlistRenderModel({
    weeklyModel: weeklyModel,
    viewState: viewState,
    searchCtx: searchCtx
  });

  if (countLabel) countLabel.textContent = model.countLabelText;

  if (model.mode === 'scoreboard') {
    for (var i = 0; i < model.sections.length; i++) {
      var sec = model.sections[i];

      var sectionEl = document.createElement('section');
      sectionEl.className = 'scoreboard-member-section';

      var h = document.createElement('h2');
      h.textContent = sec.title;

      var grid = document.createElement('div');
      grid.className = 'dex-grid';

      for (var j = 0; j < sec.entries.length; j++) {
        var e = sec.entries[j];
        grid.insertAdjacentHTML(
          'beforeend',
          renderUnifiedCard({
            name: prettifyPokemonName(e.pokemon),
            img: getPokemonGif(e.pokemon),
            info: e.info || '',
            highlighted: true,
            cardType: 'pokemon'
          })
        );
      }

      sectionEl.appendChild(h);
      sectionEl.appendChild(grid);
      container.appendChild(sectionEl);
    }

    return;
  }

  // standard (region sections)
  for (var r = 0; r < model.sections.length; r++) {
    var regionSec = model.sections[r];

    var section = document.createElement('section');
    section.className = 'region-section';

    var header = document.createElement('h2');
    header.textContent = regionSec.title;

    var grid2 = document.createElement('div');
    grid2.className = 'dex-grid';

    for (var x = 0; x < regionSec.entries.length; x++) {
      var entry = regionSec.entries[x];

      grid2.insertAdjacentHTML(
        'beforeend',
        renderUnifiedCard({
          name: prettifyPokemonName(entry.pokemon),
          img: getPokemonGif(entry.pokemon),
          info: entry.claimed ? (entry.claimedBy || '') : 'Unclaimed',
          unclaimed: !entry.claimed,
          highlighted: !!entry.highlighted,
          cardType: 'pokemon'
        })
      );
    }

    section.appendChild(header);
    section.appendChild(grid2);
    container.appendChild(section);
  }
}
