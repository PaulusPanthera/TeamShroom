// v2.0.0-alpha.1
// src/features/shinydex/shinydex.hitlist.js
// Shiny Dex — HITLIST RENDERER
// Render-only. Stateless. Controller owns UI & state.

import { buildShinyDexModel } from '../../domains/shinydex/hitlist.model.js';
import { renderUnifiedCard } from '../../ui/unifiedcard.js';
import { prettifyPokemonName } from '../../utils/utils.js';
import { POKEMON_SHOW } from '../../data/pokemondatabuilder.js';

function getPokemonGif(key) {
  return 'https://img.pokemondb.net/sprites/black-white/anim/shiny/' + key + '.gif';
}

function safeText(s) {
  return String(s || '').toLowerCase().trim();
}

export function renderShinyDexHitlist(args) {
  var weeklyModel = args.weeklyModel;
  var search = safeText(args.search);
  var unclaimedOnly = !!args.unclaimedOnly;
  var sort = String(args.sort || 'standard');
  var countLabel = args.countLabel;

  var container = document.getElementById('shiny-dex-container');
  if (!container) return;

  container.innerHTML = '';

  // --------------------------------------------------
  // SNAPSHOT (TRUTH) — NEVER ITERATE weeklyModel DIRECTLY
  // --------------------------------------------------

  var snapshot;
  try {
    snapshot = buildShinyDexModel(Array.isArray(weeklyModel) ? weeklyModel : []);
  } catch (e) {
    snapshot = [];
  }

  if (!Array.isArray(snapshot)) snapshot = [];

  // Respect show:false
  snapshot = snapshot.filter(function (e) {
    return POKEMON_SHOW[e.pokemon] !== false;
  });

  // --------------------------------------------------
  // LEADERBOARDS (member-grouped)
  // --------------------------------------------------

  if (sort === 'claims' || sort === 'points') {
    // In leaderboard modes: ignore search/unclaimed for data integrity.
    var byMember = {};

    snapshot.forEach(function (e) {
      if (!e || !e.claimed) return;
      var name = e.claimedBy || 'unknown';
      if (!byMember[name]) byMember[name] = [];
      byMember[name].push(e);
    });

    var members = Object.entries(byMember)
      .map(function (pair) {
        var name = pair[0];
        var entries = pair[1] || [];
        var points = 0;
        for (var i = 0; i < entries.length; i++) points += (entries[i].points || 0);

        return {
          name: name,
          entries: entries,
          claims: entries.length,
          points: points
        };
      })
      .sort(function (a, b) {
        return sort === 'claims' ? (b.claims - a.claims) : (b.points - a.points);
      });

    if (countLabel) countLabel.textContent = members.length + ' Members';

    members.forEach(function (m, index) {
      var section = document.createElement('section');
      section.className = 'scoreboard-member-section';

      var header = document.createElement('h2');
      header.textContent =
        (index + 1) + '. ' + m.name + ' — ' + m.claims + ' Claims · ' + m.points + ' Points';

      var grid = document.createElement('div');
      grid.className = 'dex-grid';

      m.entries.forEach(function (entry) {
        grid.insertAdjacentHTML(
          'beforeend',
          renderUnifiedCard({
            name: prettifyPokemonName(entry.pokemon),
            img: getPokemonGif(entry.pokemon),
            info: String(entry.points || 0) + ' pts',
            highlighted: true,
            cardType: 'pokemon'
          })
        );
      });

      section.appendChild(header);
      section.appendChild(grid);
      container.appendChild(section);
    });

    return;
  }

  // --------------------------------------------------
  // STANDARD MODE (species list)
  // --------------------------------------------------

  var modeBase = snapshot;

  if (unclaimedOnly) {
    modeBase = modeBase.filter(function (e) { return !e.claimed; });
  }

  // Counters: mode dataset, not post-search
  var totalSpecies = modeBase.length;
  var claimedSpecies = 0;
  for (var c = 0; c < modeBase.length; c++) {
    if (modeBase[c].claimed) claimedSpecies++;
  }

  if (countLabel) {
    if (unclaimedOnly) {
      // Unclaimed / Claimed (denominator = claimed in full snapshot)
      var claimedInSnapshot = snapshot.filter(function (e) { return e.claimed; }).length;
      countLabel.textContent = totalSpecies + ' Unclaimed';
      // If you later want "x / y Unclaimed", format here.
      void claimedInSnapshot;
    } else {
      countLabel.textContent = claimedSpecies + ' / ' + totalSpecies + ' Claimed';
    }
  }

  // Search is visibility-only, last step
  var visible = modeBase;
  if (search) {
    visible = visible.filter(function (e) {
      return prettifyPokemonName(e.pokemon).toLowerCase().indexOf(search) !== -1;
    });
  }

  // Group by region (preserve order by iterating visible in-order)
  var byRegion = {};
  visible.forEach(function (e) {
    var r = e.region || 'unknown';
    if (!byRegion[r]) byRegion[r] = [];
    byRegion[r].push(e);
  });

  Object.entries(byRegion).forEach(function (pair) {
    var region = pair[0];
    var entries = pair[1] || [];

    var section = document.createElement('section');
    section.className = 'region-section';

    var header = document.createElement('h2');

    // Region header counts based on modeBase (not post-search)
    var regionBase = modeBase.filter(function (x) { return (x.region || 'unknown') === region; });
    var regionClaimed = regionBase.filter(function (x) { return x.claimed; }).length;

    header.textContent =
      region.toUpperCase() + ' (' + regionClaimed + ' / ' + regionBase.length + ')';

    var grid = document.createElement('div');
    grid.className = 'dex-grid';

    entries.forEach(function (entry) {
      grid.insertAdjacentHTML(
        'beforeend',
        renderUnifiedCard({
          name: prettifyPokemonName(entry.pokemon),
          img: getPokemonGif(entry.pokemon),
          info: entry.claimed ? entry.claimedBy : 'Unclaimed',
          unclaimed: !entry.claimed,
          highlighted: entry.claimed && (entry.points || 0) >= 15,
          cardType: 'pokemon'
        })
      );
    });

    section.appendChild(header);
    section.appendChild(grid);
    container.appendChild(section);
  });
}
