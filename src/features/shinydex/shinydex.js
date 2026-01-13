// v2.0.0-alpha.1
// src/features/shinydex/shinydex.js
// Shiny Dex Page Controller
// Owns ALL DOM under #page-content

import { renderShinyDexHitlist } from './shinydex.hitlist.js';
import { renderShinyLivingDex } from './shinylivingdex.js';

export function setupShinyDexPage(params) {
  var weeklyModel = params.weeklyModel;
  var shinyShowcaseRows = params.shinyShowcaseRows;

  var root = document.getElementById('page-content');
  root.innerHTML = '';

  root.innerHTML = [
    '<div class="search-controls" id="dex-controls-top" style="position:relative;">',
    '  <input id="dex-search" type="text" placeholder="Search" />',
    '  <button id="dex-help" class="dex-help-btn" aria-label="Help">',
    '    <img src="img/symbols/questionmarksprite.png" alt="Help">',
    '  </button>',
    '  <button id="dex-unclaimed">Unclaimed</button>',
    '  <select id="dex-sort"></select>',
    '  <span id="dex-count"></span>',
    '  <div id="dex-help-popover" class="dex-help-popover hidden">',
    '    <div class="help-title">Search</div>',
    '    <div class="help-line">Pokémon: type a name (partial ok).</div>',
    '    <div class="help-line">Family: +name or name+ or family:name.</div>',
    '    <div class="help-line">Member: @name or member:name.</div>',
    '    <div class="help-line">Region: r:kanto / r:kan / region:unova.</div>',
    '    <div class="help-line">Tier: tier:0 tier:1 tier:2 tier:lm.</div>',
    '    <div class="help-line">Flags: unclaimed claimed unowned owned.</div>',
    '  </div>',
    '</div>',

    '<div class="search-controls">',
    '  <button id="tab-hitlist" class="dex-tab active">Shiny Dex Hitlist</button>',
    '  <button id="tab-living" class="dex-tab">Shiny Living Dex</button>',
    '</div>',

    '<div id="shiny-dex-container"></div>'
  ].join('\n');

  var searchInput = root.querySelector('#dex-search');
  var helpBtn = root.querySelector('#dex-help');
  var helpPopover = root.querySelector('#dex-help-popover');

  var unclaimedBtn = root.querySelector('#dex-unclaimed');
  var sortSelect = root.querySelector('#dex-sort');
  var countLabel = root.querySelector('#dex-count');

  var tabHitlist = root.querySelector('#tab-hitlist');
  var tabLiving = root.querySelector('#tab-living');

  var state = {
    view: 'hitlist',
    search: '',
    unclaimed: false,
    sort: 'standard'
  };

  function configureSort() {
    sortSelect.innerHTML = '';

    if (state.view === 'hitlist') {
      sortSelect.innerHTML =
        '<option value="standard">Standard</option>' +
        '<option value="claims">Total Claims</option>' +
        '<option value="points">Total Claim Points</option>';
      state.sort = 'standard';
    } else {
      sortSelect.innerHTML =
        '<option value="standard">Standard</option>' +
        '<option value="total">Total Shinies</option>';
      state.sort = 'standard';
    }
  }

  function closeHelp() {
    helpPopover.classList.add('hidden');
    helpBtn.classList.remove('active');
  }

  function toggleHelp() {
    var isHidden = helpPopover.classList.contains('hidden');
    if (isHidden) {
      helpPopover.classList.remove('hidden');
      helpBtn.classList.add('active');
      return;
    }
    closeHelp();
  }

  function render() {
    unclaimedBtn.classList.toggle('active', !!state.unclaimed);

    if (state.view === 'hitlist') {
      renderShinyDexHitlist({
        weeklyModel: weeklyModel,
        search: state.search,
        unclaimedOnly: !!state.unclaimed,
        sort: state.sort,
        countLabel: countLabel
      });
    } else {
      renderShinyLivingDex({
        showcaseRows: shinyShowcaseRows,
        search: state.search,
        unclaimedOnly: !!state.unclaimed,
        sort: state.sort,
        countLabel: countLabel
      });
    }
  }

  // close help when clicking anywhere in root except help button / popover
  root.addEventListener('click', function (e) {
    if (helpPopover.classList.contains('hidden')) return;

    var t = e.target;
    var clickedHelpBtn = helpBtn.contains(t);
    var clickedPopover = helpPopover.contains(t);

    if (!clickedHelpBtn && !clickedPopover) closeHelp();
  });

  helpBtn.addEventListener('click', function (e) {
    e.preventDefault();
    toggleHelp();
  });

  searchInput.addEventListener('input', function (e) {
    state.search = String(e.target.value || '').toLowerCase();
    render();
  });

  unclaimedBtn.addEventListener('click', function () {
    state.unclaimed = !state.unclaimed;
    render();
  });

  sortSelect.addEventListener('change', function (e) {
    state.sort = e.target.value;
    render();
  });

  tabHitlist.addEventListener('click', function () {
    if (state.view === 'hitlist') return;

    state.view = 'hitlist';
    tabHitlist.classList.add('active');
    tabLiving.classList.remove('active');

    closeHelp();
    configureSort();
    render();
  });

  tabLiving.addEventListener('click', function () {
    if (state.view === 'living') return;

    state.view = 'living';
    tabLiving.classList.add('active');
    tabHitlist.classList.remove('active');

    closeHelp();
    configureSort();
    render();
  });

  configureSort();
  render();
}
