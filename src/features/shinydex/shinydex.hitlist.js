// src/features/shinydex/shinydex.hitlist.js
// v2.0.0-alpha.1
// Shiny Dex — HITLIST RENDERER
// Render-only. Stateless. Controller owns UI & state.

import { buildShinyDexModel } from '../../domains/shinydex/hitlist.model.js';
import { renderUnifiedCard } from '../../ui/unifiedcard.js';
import { prettifyPokemonName } from '../../utils/utils.js';
import {
  POKEMON_SHOW,
  POKEMON_REGION,
  POKEMON_TIER,
  pokemonFamilies
} from '../../data/pokemondatabuilder.js';

function getPokemonGif(key) {
  return `https://img.pokemondb.net/sprites/black-white/anim/shiny/${key}.gif`;
}

function includesCI(hay, needle) {
  return String(hay || '').toLowerCase().indexOf(String(needle || '').toLowerCase()) !== -1;
}

function resolveFamilyKeyByName(partialName) {
  const q = String(partialName || '').toLowerCase().trim();
  if (!q) return null;

  const keys = Object.keys(pokemonFamilies);
  for (let i = 0; i < keys.length; i++) {
    const familyKey = keys[i];
    const stages = pokemonFamilies[familyKey] || [];
    for (let j = 0; j < stages.length; j++) {
      const mon = stages[j];
      const pretty = prettifyPokemonName(mon).toLowerCase();
      if (pretty.indexOf(q) !== -1) return familyKey;
    }
  }
  return null;
}

function matchRegion(pokemonKey, regionText) {
  const rt = String(regionText || '').toLowerCase().trim();
  if (!rt) return true;
  const r = (POKEMON_REGION[pokemonKey] || 'unknown').toLowerCase();
  return r.indexOf(rt) === 0; // partial ok
}

function matchTier(pokemonKey, tierText) {
  const tt = String(tierText || '').toLowerCase().trim();
  if (!tt) return true;
  const tier = (POKEMON_TIER[pokemonKey] || '').toLowerCase().replace('tier', '').trim();
  // tier becomes "0"/"1"/.../"lm"
  return tier === tt;
}

export function renderShinyDexHitlist({
  weeklyModel,
  sort,
  unclaimedOnly,
  query,
  countLabel
}) {
  const container = document.getElementById('shiny-dex-container');
  if (!container) return;
  container.innerHTML = '';

  const snapshot = buildShinyDexModel(weeklyModel || []).filter(e => POKEMON_SHOW[e.pokemon] !== false);

  const isLeaderboard = sort === 'claims' || sort === 'points';

  // LEADERBOARDS: search filters MEMBERS, preserves rank from full list
  if (isLeaderboard) {
    const claimed = snapshot.filter(e => e.claimed);

    const byMember = {};
    claimed.forEach(e => {
      const name = e.claimedBy || '';
      if (!name) return;
      if (!byMember[name]) byMember[name] = [];
      byMember[name].push(e);
    });

    const full = Object.entries(byMember).map(entry => {
      const name = entry[0];
      const entries = entry[1] || [];
      const points = entries.reduce((s, x) => s + (x.points || 0), 0);
      return { name, entries, claims: entries.length, points };
    }).sort((a, b) => {
      return sort === 'claims' ? (b.claims - a.claims) : (b.points - a.points);
    }).map((m, idx) => {
      m.rank = idx + 1;
      return m;
    });

    const memberNeedle = query && query.memberText ? query.memberText : (query && query.pokemonText ? query.pokemonText : '');
    const visible = memberNeedle
      ? full.filter(m => includesCI(m.name, memberNeedle))
      : full;

    countLabel.textContent = `${visible.length} Members`;

    visible.forEach(m => {
      const section = document.createElement('section');
      section.className = 'scoreboard-member-section';

      const header = document.createElement('h2');
      header.textContent =
        `${m.rank}. ${m.name} — ${m.claims} Claims · ${m.points} Points`;

      const grid = document.createElement('div');
      grid.className = 'dex-grid';

      m.entries.forEach(entry => {
        grid.insertAdjacentHTML(
          'beforeend',
          renderUnifiedCard({
            name: prettifyPokemonName(entry.pokemon),
            img: getPokemonGif(entry.pokemon),
            info: `${entry.points} pts`,
            highlighted: true,
            cardType: 'pokemon',
            pokemonKey: entry.pokemon
          })
        );
      });

      section.append(header, grid);
      container.appendChild(section);
    });

    return;
  }

  // STANDARD: mode dataset (pre-search counters)
  let mode = snapshot.slice();

  // status tokens (optional)
  const requireUnclaimed = !!(query && query.requireUnclaimed);
  const requireClaimed = !!(query && query.requireClaimed);

  // region/tier (mode dataset)
  mode = mode.filter(e => matchRegion(e.pokemon, query ? query.regionText : ''));
  mode = mode.filter(e => matchTier(e.pokemon, query ? query.tierText : ''));

  // toggle unclaimed
  if (unclaimedOnly) {
    mode = mode.filter(e => !e.claimed);
  }

  // status tokens refine
  if (requireUnclaimed) mode = mode.filter(e => !e.claimed);
  if (requireClaimed) mode = mode.filter(e => e.claimed);

  const totalSpecies = snapshot.length;
  const claimedSpecies = snapshot.filter(e => e.claimed).length;

  // header count label (your display rules)
  if (unclaimedOnly || requireUnclaimed) {
    const unclaimedCount = snapshot.length - claimedSpecies;
    countLabel.textContent = `${unclaimedCount} Unclaimed`;
  } else {
    countLabel.textContent = `${claimedSpecies} / ${totalSpecies} Claimed`;
  }

  // SEARCH (LAST) — pokemon/family text
  const pokemonNeedle = query && query.pokemonText ? query.pokemonText : '';
  const familyNeedle = query && query.familyText ? query.familyText : '';

  let familyKey = null;
  if (familyNeedle) familyKey = resolveFamilyKeyByName(familyNeedle);

  const visible = mode.filter(e => {
    if (familyKey) {
      const stages = pokemonFamilies[familyKey] || [];
      return stages.indexOf(e.pokemon) !== -1 || e.pokemon === familyKey;
    }
    if (pokemonNeedle) {
      const pretty = prettifyPokemonName(e.pokemon).toLowerCase();
      return pretty.indexOf(pokemonNeedle.toLowerCase()) !== -1;
    }
    return true;
  });

  // GROUP BY REGION (visible render)
  const byRegion = {};
  visible.forEach(e => {
    const r = (POKEMON_REGION[e.pokemon] || e.region || 'unknown').toLowerCase();
    if (!byRegion[r]) byRegion[r] = [];
    byRegion[r].push(e);
  });

  Object.entries(byRegion).forEach(entry => {
    const region = entry[0];
    const entries = entry[1] || [];

    const section = document.createElement('section');
    section.className = 'region-section';

    // region header counts from MODE DATASET (not post-search)
    const regionMode = mode.filter(x => (POKEMON_REGION[x.pokemon] || x.region || 'unknown').toLowerCase() === region);
    const regionClaimed = regionMode.filter(x => x.claimed).length;

    const header = document.createElement('h2');
    header.textContent = `${region.toUpperCase()} (${regionClaimed} / ${regionMode.length})`;

    const grid = document.createElement('div');
    grid.className = 'dex-grid';

    entries.forEach(mon => {
      grid.insertAdjacentHTML(
        'beforeend',
        renderUnifiedCard({
          name: prettifyPokemonName(mon.pokemon),
          img: getPokemonGif(mon.pokemon),
          info: mon.claimed ? mon.claimedBy : 'Unclaimed',
          unclaimed: !mon.claimed,
          highlighted: mon.claimed && (mon.points || 0) >= 15,
          cardType: 'pokemon',
          pokemonKey: mon.pokemon
        })
      );
    });

    section.append(header, grid);
    container.appendChild(section);
  });
}
