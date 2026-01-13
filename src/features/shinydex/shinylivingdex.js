// v2.0.0-alpha.1
// src/features/shinydex/shinylivingdex.js
// Living Dex Renderer — DOM only (consumes presenter model + binds owners tooltip)

import { renderUnifiedCard } from '../../ui/unifiedcard.js';
import { prettifyPokemonName } from '../../utils/utils.js';
import { prepareLivingDexRenderModel } from './shinydex.livingdex.presenter.js';
import { bindDexOwnerTooltip } from './shinydex.tooltip.js';

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

export function renderShinyLivingDex(opts) {
  var showcaseRows = opts && opts.showcaseRows;
  var viewState = opts && opts.viewState;
  var searchCtx = opts && opts.searchCtx;
  var countLabel = opts && opts.countLabel;

  var container = document.getElementById('shiny-dex-container');
  if (!container) return;

  container.innerHTML = '';

  var model;
  try {
    model = prepareLivingDexRenderModel({
      showcaseRows: showcaseRows || [],
      viewState: viewState || { sort: 'standard', search: '', showUnclaimed: false },
      searchCtx: searchCtx || {}
    });
  } catch (e) {
    container.innerHTML =
      '<div style="text-align:center;opacity:0.7;padding:20px;">Living Dex failed to render.</div>';
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

  sections.forEach(function (sec) {
    var section = document.createElement('section');
    section.className = 'region-section';

    var header = document.createElement('h2');
    header.textContent = sec.title || '';

    var grid = document.createElement('div');
    grid.className = 'dex-grid';

    (sec.entries || []).forEach(function (entry) {
      var c = Number(entry.count) || 0;
      var info =
        c === 0 ? 'Unowned' :
        c === 1 ? '1 Shiny' :
        (c + ' Shinies');

      grid.insertAdjacentHTML(
        'beforeend',
        renderUnifiedCard({
          key: entry.pokemon,
          name: prettifyPokemonName(entry.pokemon),
          img: getPokemonGif(entry.pokemon),
          info: info,
          unclaimed: c === 0,
          highlighted: c > 0,
          owners: entry.owners || [],
          cardType: 'pokemon'
        })
      );
    });

    section.append(header, grid);
    container.appendChild(section);
  });

  // bind owners hover tooltip after render
  bindDexOwnerTooltip(container);
}
