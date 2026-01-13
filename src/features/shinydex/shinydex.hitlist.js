// v2.0.0-alpha.3
// src/features/shinydex/shinydex.hitlist.js
// Shiny Dex — HITLIST RENDERER (DOM-only)
// UnifiedCard v3: points always shown; tier is frame-only via tier-map in unifiedcard.

import { renderUnifiedCard } from '../../ui/unifiedcard.js';
import { prettifyPokemonName } from '../../utils/utils.js';
import { POKEMON_POINTS } from '../../data/pokemondatabuilder.js';

function getPokemonGif(pokemonKey) {
  const overrides = {
    mrmime: 'mr-mime',
    mimejr: 'mime-jr',
    'nidoran-f': 'nidoran-f',
    'nidoran-m': 'nidoran-m',
    typenull: 'type-null',
    'porygon-z': 'porygon-z'
  };

  const key = overrides[pokemonKey] || pokemonKey;
  return `https://img.pokemondb.net/sprites/black-white/anim/shiny/${key}.gif`;
}

function buildVariantsForEntry(entry, fallbackInfoText) {
  // Future-proof: accept several shapes without breaking.
  const vc = entry && (entry.variantClaims || entry.variants || entry.specialClaims) ? (entry.variantClaims || entry.variants || entry.specialClaims) : {};
  const standardInfo = fallbackInfoText || '';

  const secretOwner = vc && (vc.secret || vc.SECRET) ? String(vc.secret || vc.SECRET) : '';
  const alphaOwner = vc && (vc.alpha || vc.ALPHA) ? String(vc.alpha || vc.ALPHA) : '';
  const safariOwner = vc && (vc.safari || vc.SAFARI) ? String(vc.safari || vc.SAFARI) : '';

  return [
    { key: 'standard', title: 'Standard', enabled: true, infoText: standardInfo, active: true },
    { key: 'secret', title: 'Secret', enabled: Boolean(secretOwner), infoText: secretOwner || '—', active: false },
    { key: 'alpha', title: 'Alpha', enabled: Boolean(alphaOwner), infoText: alphaOwner || '—', active: false },
    { key: 'safari', title: 'Safari', enabled: Boolean(safariOwner), infoText: safariOwner || '—', active: false }
  ];
}

export function renderHitlistFromModel(model) {
  const container = document.getElementById('shiny-dex-container');
  container.innerHTML = '';

  if (!model || !Array.isArray(model.sections)) return;

  if (model.mode === 'scoreboard') {
    model.sections.forEach(sec => {
      const section = document.createElement('section');
      section.className = 'scoreboard-member-section';

      const header = document.createElement('h2');
      header.textContent = sec.title || '';

      const grid = document.createElement('div');
      grid.className = 'dex-grid';

      (sec.entries || []).forEach(entry => {
        const key = entry.pokemon;
        const points = Number(entry.points ?? POKEMON_POINTS?.[key] ?? 0);

        const infoText = entry.claimedBy ? String(entry.claimedBy) : 'Claimed';
        const variants = buildVariantsForEntry(entry, infoText);

        grid.insertAdjacentHTML(
          'beforeend',
          renderUnifiedCard({
            pokemonName: prettifyPokemonName(key),
            artSrc: getPokemonGif(key),
            points: points,
            infoText: infoText,
            isUnclaimed: false,
            owners: entry.claimedBy ? [String(entry.claimedBy)] : [],
            variants: variants
          })
        );
      });

      section.append(header, grid);
      container.appendChild(section);
    });

    return;
  }

  model.sections.forEach(sec => {
    const section = document.createElement('section');
    section.className = 'region-section';

    const header = document.createElement('h2');
    header.textContent = sec.title || '';

    const grid = document.createElement('div');
    grid.className = 'dex-grid';

    (sec.entries || []).forEach(entry => {
      const key = entry.pokemon;
      const points = Number(entry.points ?? POKEMON_POINTS?.[key] ?? 0);

      const claimed = Boolean(entry.claimed);
      const claimedBy = entry.claimedBy ? String(entry.claimedBy) : '';
      const infoText = claimed ? (claimedBy || 'Claimed') : 'Unclaimed';

      const variants = buildVariantsForEntry(entry, infoText);

      grid.insertAdjacentHTML(
        'beforeend',
        renderUnifiedCard({
          pokemonName: prettifyPokemonName(key),
          artSrc: getPokemonGif(key),
          points: points,
          infoText: infoText,
          isUnclaimed: !claimed,
          owners: claimedBy ? [claimedBy] : [],
          variants: variants
        })
      );
    });

    section.append(header, grid);
    container.appendChild(section);
  });
}
