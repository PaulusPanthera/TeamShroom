// src/features/shinydex/shinydex.hitlist.js
// v2.0.0-beta
// Shiny Dex — HITLIST RENDERER (DOM-only)
// UnifiedCard v2: points always shown; tier is frame-only via tier-map in unifiedcard.

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

function buildVariantsForEntry(entry, fallbackInfoText, selectedKey) {
  const vo = entry && entry.variantOwners ? entry.variantOwners : {};
  const standardInfo = fallbackInfoText || '';

  const secretOwner = vo && vo.secret ? String(vo.secret) : '';
  const alphaOwner = vo && vo.alpha ? String(vo.alpha) : '';
  const safariOwner = vo && vo.safari ? String(vo.safari) : '';

  const wanted = selectedKey || 'standard';

  return [
    { key: 'standard', title: 'Standard', enabled: true, infoText: standardInfo, active: wanted === 'standard' },
    { key: 'secret', title: 'Secret', enabled: Boolean(secretOwner), infoText: secretOwner || 'Unclaimed', active: wanted === 'secret' },
    { key: 'alpha', title: 'Alpha', enabled: Boolean(alphaOwner), infoText: alphaOwner || 'Unclaimed', active: wanted === 'alpha' },
    { key: 'safari', title: 'Safari', enabled: Boolean(safariOwner), infoText: safariOwner || 'Unclaimed', active: wanted === 'safari' }
  ];
}

export function renderHitlistFromModel(model, opts) {
  const container = document.getElementById('shiny-dex-container');
  container.innerHTML = '';

  const selectedVariantByKey = opts && opts.selectedVariantByKey;

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
        const wanted = selectedVariantByKey && typeof selectedVariantByKey.get === 'function' ? selectedVariantByKey.get(key) : null;
        const variants = buildVariantsForEntry(entry, infoText, wanted);

        grid.insertAdjacentHTML(
          'beforeend',
          renderUnifiedCard({
            pokemonKey: key,
            pokemonName: prettifyPokemonName(key),
            artSrc: getPokemonGif(key),
            points: points,
            infoText: infoText,
            isUnclaimed: false,
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

      const wanted = selectedVariantByKey && typeof selectedVariantByKey.get === 'function' ? selectedVariantByKey.get(key) : null;
      const variants = buildVariantsForEntry(entry, infoText, wanted);

      grid.insertAdjacentHTML(
        'beforeend',
        renderUnifiedCard({
          pokemonKey: key,
          pokemonName: prettifyPokemonName(key),
          artSrc: getPokemonGif(key),
          points: points,
          infoText: infoText,
          isUnclaimed: !claimed,
          variants: variants
        })
      );
    });

    section.append(header, grid);
    container.appendChild(section);
  });
}
