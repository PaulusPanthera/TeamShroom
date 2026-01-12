// src/features/shinydex/shinydex.js
// Shiny Dex — HITLIST VIEW

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

  /* ---------------- CONTROLS ---------------- */

  const controls = document.createElement('div');
  controls.className = 'search-controls';

  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.placeholder = 'Search…';

  const unclaimedBtn = document.createElement('button');
  unclaimedBtn.textContent = 'Unclaimed';
  unclaimedBtn.dataset.active = 'false';

  const viewSelect = document.createElement('select');
  viewSelect.innerHTML = `
    <option value="standard">Standard</option>
    <option value="claims">Total Claims</option>
    <option value="points">Total Claim Points</option>
  `;

  const totalCounter = document.createElement('span');

  controls.append(searchInput, unclaimedBtn, viewSelect, totalCounter);
  container.appendChild(controls);

  const content = document.createElement('div');
  container.appendChild(content);

  /* ---------------- DATA ---------------- */

  const dex = buildShinyDexModel(weeklyModel).filter(
    e => POKEMON_SHOW[e.pokemon] !== false
  );

  /* ---------------- STANDARD ---------------- */

  function renderStandard(list) {
    content.innerHTML = '';
    totalCounter.textContent = `${list.length} Pokémon`;

    const byRegion = {};
    list.forEach(e => {
      byRegion[e.region] ??= [];
      byRegion[e.region].push(e);
    });

    Object.entries(byRegion).forEach(([region, entries]) => {
      const section = document.createElement('section');
      section.className = 'region-section';

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

      section.append(header, grid);
      content.appendChild(section);
    });
  }

  /* ---------------- GROUPED ---------------- */

  function renderGrouped(mode) {
    content.innerHTML = '';

    const byMember = {};
    dex.forEach(e => {
      if (!e.claimed) return;
      byMember[e.claimedBy] ??= [];
      byMember[e.claimedBy].push(e);
    });

    const members = Object.keys(byMember)
      .map(name => {
        const entries = byMember[name];
        return {
          name,
          entries,
          claims: entries.length,
          points: entries.reduce((s, e) => s + e.points, 0)
        };
      })
      .sort((a, b) =>
        mode === 'claims'
          ? b.claims - a.claims
          : b.points - a.points
      );

    totalCounter.textContent = `${members.length} Members`;

    members.forEach((m, index) => {
      const section = document.createElement('section');
      section.className = 'scoreboard-member-section';

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

      section.append(header, grid);
      content.appendChild(section);
    });
  }

  /* ---------------- PIPELINE ---------------- */

  function apply() {
    const q = searchInput.value.toLowerCase();
    const unclaimedOnly = unclaimedBtn.dataset.active === 'true';
    const mode = viewSelect.value;

    let list = dex.filter(e =>
      prettifyPokemonName(e.pokemon).toLowerCase().includes(q)
    );

    if (unclaimedOnly) {
      list = list.filter(e => !e.claimed);
    }

    if (mode === 'standard') {
      renderStandard(list);
    } else {
      renderGrouped(mode);
    }
  }

  searchInput.addEventListener('input', apply);

  unclaimedBtn.addEventListener('click', () => {
    const active = unclaimedBtn.dataset.active === 'true';
    unclaimedBtn.dataset.active = String(!active);
    apply();
  });

  viewSelect.addEventListener('change', apply);

  apply();
}
