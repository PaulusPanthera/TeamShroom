// v2.0.0-alpha.1
// src/features/shinydex/shinydex.hitlist.js
// Hitlist Renderer — DOM only (consumes presenter model)

import { renderUnifiedCard } from '../../ui/unifiedcard.js';
import { prettifyPokemonName } from '../../utils/utils.js';
import { prepareHitlistRenderModel } from './shinydex.hitlist.presenter.js';

function getPokemonGif(key) {
  var overrides = {
    mrmime: 'mr-mime',
    mimejr: 'mime-jr',
    'nidoran-f': 'nidoran-f',
    'nidoran-m': 'nidoran-m',
    typenull: 'type-null',
    'porygon-z': 'porygon-z'
  };
  var k = overrides[key] || key;
  return 'https://img.pokemondb.net/sprites/black-white/anim/shiny/' + k + '.gif';
}

export function renderShinyDexHitlist(opts) {
  var weeklyModel = opts && opts.weeklyModel;
  var viewState = opts && opts.viewState;
  var searchCtx = opts && opts.searchCtx;
  var countLabel = opts && opts.countLabel;

  var container = document.getElementById('shiny-dex-container');
  if (!container) return;

  container.innerHTML = '';

  var model;
  try {
    model = prepareHitlistRenderModel({
      weeklyModel: weeklyModel || [],
      viewState: viewState || { sort: 'standard', search: '', showUnclaimed: false },
      searchCtx: searchCtx || {}
    });
  } catch (e) {
    container.innerHTML =
      '<div style="text-align:center;opacity:0.7;padding:20px;">Hitlist failed to render.</div>';
    if (countLabel) countLabel.textContent = '';
    return;
  }

  if (countLabel) countLabel.textContent = model.countLabelText || '';

  var sections = (model && model.sections) ? model.sections : [];
  if (!sections.length) {
    container.innerHTML =
      '<div style="text-align:center;opacity:0.7;padding:20px;">No results.</div>';
    return;
  }

  // scoreboard mode
  if (model.mode === 'scoreboard') {
    sections.forEach(function (sec) {
      var section = document.createElement('section');
      section.className = 'scoreboard-member-section';

      var header = document.createElement('h2');
      header.textContent = sec.title || '';

      var grid = document.createElement('div');
      grid.className = 'dex-grid';

      (sec.entries || []).forEach(function (entry) {
        grid.insertAdjacentHTML(
          'beforeend',
          renderUnifiedCard({
            key: entry.pokemon,
            name: prettifyPokemonName(entry.pokemon),
            img: getPokemonGif(entry.pokemon),
            info: entry.info || (entry.points + ' pts'),
            highlighted: true,
            cardType: 'pokemon'
          })
        );
      });

      section.append(header, grid);
      container.appendChild(section);
    });

    return;
  }

  // standard mode
  sections.forEach(function (sec) {
    var section = document.createElement('section');
    section.className = 'region-section';

    var header = document.createElement('h2');
    header.textContent = sec.title || '';

    var grid = document.createElement('div');
    grid.className = 'dex-grid';

    (sec.entries || []).forEach(function (entry) {
      grid.insertAdjacentHTML(
        'beforeend',
        renderUnifiedCard({
          key: entry.pokemon,
          name: prettifyPokemonName(entry.pokemon),
          img: getPokemonGif(entry.pokemon),
          info: entry.claimed ? (entry.claimedBy || '') : 'Unclaimed',
          unclaimed: !entry.claimed,
          highlighted: !!entry.highlighted,
          cardType: 'pokemon'
        })
      );
    });

    section.append(header, grid);
    container.appendChild(section);
  });
}
