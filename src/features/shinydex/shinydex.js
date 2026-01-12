// src/features/shinydex/shinydex.js
// Shiny Dex — HITLIST VIEW (CLAIM-BASED, IMMUTABLE)

import { buildShinyDexModel } from '../../data/shinydex.model.js';
import { renderUnifiedCard } from '../../ui/unifiedcard.js';
import { prettifyPokemonName } from '../../utils/utils.js';
import {
  POKEMON_SHOW,
  POKEMON_REGION
} from '../../data/pokemondatabuilder.js';

function getPokemonGif(pokemonKey) {
  return `https://img.pokemondb.net/sprites/black-white/anim/shiny/${pokemonKey}.gif`;
}

export function renderShinyDexHitlist(weeklyModel, controlsState) {
  const container = document.getElementById('shiny-dex-container');
  container.innerHTML = '';

  const dex = buildShinyDexModel(weeklyModel).filter(
    e => POKEMON_SHOW[e.pokemon] !== false
  );

  let list = dex.filter(e =>
    prettifyPokemonName(e.pokemon)
      .toLowerCase()
      .includes(controlsState.search)
  );

  if (controlsState.unclaimedOnly) {
    list = list.filter(e => !e.claimed);
  }

  // ---------------- STANDARD ----------------
  if (controlsState.mode === 'standard') {
    const byRegion = {};

    list.forEach(e => {
      const region = e.region || POKEMON_REGION[e.pokemon] || 'unknown';
      byRegion[region] ??= [];
      byRegion[region].push(e);
    });

    Object.entries(byRegion).forEach(([region, entries]) => {
      const section = document.createElement('section');
      section.className = 'region-section';

      const claimedCount = entries.filter(e => e.claimed).length;

      const header = document.createElement('h2');
      header.textContent = `${region.toUpperCase()} (${claimedCount} / ${entries.length})`;

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
            highlighted: entry.claimed,
            cardType: 'pokemon'
          })
        );
      });

      section.append(header, grid);
      container.appendChild(section);
    });

    return;
  }

  // ---------------- GROUPED (CLAIMS / POINTS) ----------------
  const byMember = {};
  dex.forEach(e => {
    if (!e.claimed) return;
    byMember[e.claimedBy] ??= [];
    byMember[e.claimedBy].push(e);
  });

  const members = Object.entries(byMember)
    .map(([name, entries]) => ({
      name,
      entries,
      claims: entries.length,
      points: entries.reduce((s, e) => s + e.points, 0)
    }))
    .sort((a, b) =>
      controlsState.mode === 'claims'
        ? b.claims - a.claims
        : b.points - a.points
    );

  members.forEach((m, index) => {
    const section = document.createElement('section');
    section.className = 'scoreboard-member-section';

    const header = document.createElement('h2');
    header.textContent =
      controlsState.mode === 'claims'
        ? `${index + 1}. ${m.name} — ${m.claims} claims • ${m.points} pts`
        : `${index + 1}. ${m.name} — ${m.points} pts • ${m.claims} claims`;

    const grid = document.createElement('div');
    grid.className = 'dex-grid';

    m.entries.forEach(entry => {
      grid.insertAdjacentHTML(
        'beforeend',
        renderUnifiedCard({
          name: prettifyPokemonName(entry.pokemon),
          img: getPokemonGif(entry.pokemon),
          info:
            controlsState.mode === 'claims'
              ? entry.claimedBy
              : `${entry.points} pts`,
          highlighted: true,
          cardType: 'pokemon'
        })
      );
    });

    section.append(header, grid);
    container.appendChild(section);
  });
}
