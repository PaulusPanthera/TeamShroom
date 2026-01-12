// src/features/shinydex/shinydex.js
// Shiny Dex — HITLIST VIEW (Standard + Grouped Leaderboard Views)

import { buildShinyDexModel } from '../../data/shinydex.model.js';
import { renderUnifiedCard } from '../../ui/unifiedcard.js';
import { prettifyPokemonName } from '../../utils/utils.js';
import { POKEMON_SHOW } from '../../data/pokemondatabuilder.js';

function getPokemonGif(pokemonKey) {
  return `https://img.pokemondb.net/sprites/black-white/anim/shiny/${pokemonKey}.gif`;
}

export function renderShinyDexHitlist(weeklyModel) {
  const container = document.getElementById('shiny-dex-container');
  container.innerHTML = '';

  /* -------------------------------------------------------
     CONTROLS
  ------------------------------------------------------- */

  const controls = document.createElement('div');
  controls.className = 'dex-controls';

  const searchInput = document.createElement('input');
  searchInput.placeholder = 'Search…';

  const viewSelect = document.createElement('select');
  viewSelect.innerHTML = `
    <option value="standard">Standard</option>
    <option value="claims">Total Claims</option>
    <option value="points">Total Claim Points</option>
  `;

  const totalCounter = document.createElement('div');
  totalCounter.className = 'dex-total';

  controls.append(searchInput, viewSelect, totalCounter);
  container.appendChild(controls);

  const content = document.createElement('div');
  container.appendChild(content);

  /* -------------------------------------------------------
     DATA
  ------------------------------------------------------- */

  const dex = buildShinyDexModel(weeklyModel).filter(
    e => POKEMON_SHOW[e.pokemon] !== false
  );

  /* -------------------------------------------------------
     STANDARD VIEW (REGION GROUPED)
  ------------------------------------------------------- */

  function renderStandard(list) {
    content.innerHTML = '';
    totalCounter.textContent = `${list.length} Pokémon`;

    const byRegion = {};
    list.forEach(e => {
      byRegion[e.region] ??= [];
      byRegion[e.region].push(e);
    });

    Object.entries(byRegion).forEach(([region, entries]) => {
      const claimedCount = entries.filter(e => e.claimed).length;

      const header = document.createElement('h2');
      header.textContent = `${region} (${claimedCount} / ${entries.length})`;

      const grid = document.createElement('div');
      grid.className = 'dex-grid';

      entries.forEach(entry => {
        grid.insertAdjacentHTML(
          'beforeend',
          renderUnifiedCard({
            name: prettifyPokemonName(entry.pokemon),
            img: getPokemonGif(entry.pokemon),
            info: entry.claimed ? entry.claimedBy : 'Unclaimed',
            unclaimed: !entry.claimed,
            highlighted: entry.claimed && entry.points >= 15,
            cardType: 'pokemon'
          })
        );
      });

      content.append(header, grid);
    });
  }

  /* -------------------------------------------------------
     GROUPED MEMBER VIEWS
  ------------------------------------------------------- */

  function groupByMember() {
    const map = {};
    dex.forEach(e => {
      if (!e.claimed) return;
      map[e.claimedBy] ??= [];
      map[e.claimedBy].push(e);
    });
    return map;
  }

  function renderGrouped(mode) {
    content.innerHTML = '';

    const groups = groupByMember();

    const members = Object.keys(groups)
      .map(name => {
        const entries = groups[name];
        const claims = entries.length;
        const points = entries.reduce((s, e) => s + e.points, 0);
        return { name, entries, claims, points };
      })
      .sort((a, b) =>
        mode === 'claims'
          ? b.claims - a.claims
          : b.points - a.points
      );

    totalCounter.textContent = `${members.length} Members`;

    members.forEach((m, index) => {
      const header = document.createElement('h2');
      header.textContent =
        mode === 'claims'
          ? `${index + 1}. ${m.name} — ${m.claims} claims`
          : `${index + 1}. ${m.name} — ${m.points} points`;

      const grid = document.createElement('div');
      grid.className = 'dex-grid';

      m.entries.forEach(entry => {
        grid.insertAdjacentHTML(
          'beforeend',
          renderUnifiedCard({
            name: prettifyPokemonName(entry.pokemon),
            img: getPokemonGif(entry.pokemon),
            info:
              mode === 'claims'
                ? entry.claimedBy
                : `${entry.points} pts`,
            highlighted: true,
            cardType: 'pokemon'
          })
        );
      });

      content.append(header, grid);
    });
  }

  /* -------------------------------------------------------
     PIPELINE
  ------------------------------------------------------- */

  function apply() {
    const q = searchInput.value.toLowerCase();
    const mode = viewSelect.value;

    if (mode === 'standard') {
      renderStandard(
        dex.filter(e =>
          prettifyPokemonName(e.pokemon).toLowerCase().includes(q)
        )
      );
    } else {
      renderGrouped(mode);
    }
  }

  searchInput.addEventListener('input', apply);
  viewSelect.addEventListener('change', apply);

  apply();
}
