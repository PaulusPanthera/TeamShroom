// src/features/shinydex/shinydex.card.adapter.js
// v2.0.0-beta
// ShinyDex-owned adapter translating presenter/domain entries into UnifiedCard props.

import { prettifyPokemonName, getPokemonDbShinyGifSrc } from '../../utils/utils.js';
import { POKEMON_POINTS } from '../../data/pokemondatabuilder.js';
import { normalizeVariant } from './shinydex.variants.state.js';

function buildHitlistVariants(entry, standardInfoText, wantedVariant) {
  const vo = entry && entry.variantOwners ? entry.variantOwners : {};
  const wanted = normalizeVariant(wantedVariant);

  const secretOwner = vo && vo.secret ? String(vo.secret) : '';
  const alphaOwner = vo && vo.alpha ? String(vo.alpha) : '';
  const safariOwner = vo && vo.safari ? String(vo.safari) : '';

  return [
    { key: 'standard', title: 'Standard', enabled: true, infoText: standardInfoText || '', active: wanted === 'standard' },
    { key: 'secret', title: 'Secret', enabled: Boolean(secretOwner), infoText: secretOwner || 'Unclaimed', active: wanted === 'secret' },
    { key: 'alpha', title: 'Alpha', enabled: Boolean(alphaOwner), infoText: alphaOwner || 'Unclaimed', active: wanted === 'alpha' },
    { key: 'safari', title: 'Safari', enabled: Boolean(safariOwner), infoText: safariOwner || 'Unclaimed', active: wanted === 'safari' }
  ];
}

function buildLivingVariants(entry, totalInfoText, wantedVariant) {
  const wanted = normalizeVariant(wantedVariant);
  const vc = (entry && entry.variantCounts) ? entry.variantCounts : null;

  const secretCount = vc ? (Number(vc.secret) || 0) : 0;
  const alphaCount = vc ? (Number(vc.alpha) || 0) : 0;
  const safariCount = vc ? (Number(vc.safari) || 0) : 0;

  function countText(n) {
    const c = Number(n) || 0;
    if (c === 0) return 'Unowned';
    if (c === 1) return '1 Shiny';
    return `${c} Shinies`;
  }

  // Living Dex: variant switches change the visible infoText to that variant's count.
  // Owners tooltip is variant-filtered when ownersByVariant exists.
  // Disabled variants are still visible but non-interactive.
  return [
    { key: 'standard', title: 'Standard', enabled: true, infoText: totalInfoText, active: wanted === 'standard' },
    { key: 'secret', title: 'Secret', enabled: secretCount > 0, infoText: countText(secretCount), active: wanted === 'secret' },
    { key: 'alpha', title: 'Alpha', enabled: alphaCount > 0, infoText: countText(alphaCount), active: wanted === 'alpha' },
    { key: 'safari', title: 'Safari', enabled: safariCount > 0, infoText: countText(safariCount), active: wanted === 'safari' }
  ];
}


function buildClaimVariants(entry) {
  const kind = String(entry && entry.claimKind ? entry.claimKind : 'standard').toLowerCase();
  const claimValue = Number(entry && entry.claimValue) || 0;

  const caught = entry && entry.caughtPokemon ? String(entry.caughtPokemon) : '';
  const slot = entry && entry.pokemon ? String(entry.pokemon) : '';

  const claimText = claimValue === 1 ? '+1 Claim' : `+${claimValue} Claims`;
  const labels = {
    standard: caught && slot && caught !== slot
      ? `From ${prettifyPokemonName(caught)} · ${claimText}`
      : `Base Claim · ${claimText}`,
    secret: `Secret Claim · ${claimText}`,
    alpha: `Alpha Claim · ${claimText}`,
    safari: `Safari Claim · ${claimText}`
  };

  return ['standard', 'secret', 'alpha', 'safari'].map(key => ({
    key,
    title: key === 'standard' ? 'Standard' : key.charAt(0).toUpperCase() + key.slice(1),
    enabled: key === kind,
    infoText: key === kind ? (labels[kind] || 'Claim') : '',
    active: key === kind
  }));
}

function claimInfoText(entry) {
  const kind = String(entry && entry.claimKind ? entry.claimKind : 'standard').toLowerCase();
  const claimValue = Number(entry && entry.claimValue) || 0;
  const claimText = claimValue === 1 ? '+1 Claim' : `+${claimValue} Claims`;

  if (kind === 'standard') {
    const caught = entry && entry.caughtPokemon ? String(entry.caughtPokemon) : '';
    const slot = entry && entry.pokemon ? String(entry.pokemon) : '';
    if (caught && slot && caught !== slot) return `From ${prettifyPokemonName(caught)} · ${claimText}`;
    return `Base Claim · ${claimText}`;
  }

  if (kind === 'secret') return `Secret Claim · ${claimText}`;
  if (kind === 'alpha') return `Alpha Claim · ${claimText}`;
  if (kind === 'safari') return `Safari Claim · ${claimText}`;
  return claimText || 'Claim';
}


export function toUnifiedCardPropsForHitlistClaim(entry) {
  const key = entry && entry.pokemon ? String(entry.pokemon) : '';
  const tierPoints = Number(entry?.points ?? POKEMON_POINTS?.[key] ?? 0);
  const claimPoints = Number(entry && entry.claimPoints) || 0;
  const kind = String(entry && entry.claimKind ? entry.claimKind : 'standard').toLowerCase();

  return {
    pokemonKey: key,
    pokemonName: prettifyPokemonName(key),
    artSrc: getPokemonDbShinyGifSrc(key),
    // Keep species tier styling independent from how many points this individual
    // claim award contributes.
    points: tierPoints,
    headerRightText: kind === 'standard' ? `${claimPoints}P` : `+${claimPoints}P`,
    infoText: claimInfoText(entry),
    isUnclaimed: false,
    variants: buildClaimVariants(entry),
    claimKind: kind
  };
}

export function toUnifiedCardPropsForHitlist(entry, wantedVariant, options) {
  const key = entry && entry.pokemon ? String(entry.pokemon) : '';
  const points = Number(entry?.points ?? POKEMON_POINTS?.[key] ?? 0);

  const mode = options && options.mode;
  const isScoreboard = mode === 'scoreboard';

  const claimed = isScoreboard ? true : Boolean(entry && entry.claimed);
  const claimedBy = entry && entry.claimedBy ? String(entry.claimedBy) : '';
  const infoText = claimed ? (claimedBy || 'Claimed') : 'Unclaimed';

  return {
    pokemonKey: key,
    pokemonName: prettifyPokemonName(key),
    artSrc: getPokemonDbShinyGifSrc(key),
    points: points,
    infoText: infoText,
    isUnclaimed: !claimed,
    variants: buildHitlistVariants(entry, infoText, wantedVariant)
  };
}

export function toUnifiedCardPropsForLivingDex(entry, wantedVariant) {
  const key = entry && entry.pokemon ? String(entry.pokemon) : '';
  const count = Number(entry && entry.count) || 0;

  const infoText =
    count === 0 ? 'Unowned' :
    count === 1 ? '1 Shiny' :
    `${count} Shinies`;

  const points = Number(entry?.points ?? POKEMON_POINTS?.[key] ?? 0);
  const ownersAll = Array.isArray(entry && entry.owners) ? entry.owners : [];
  const ownersByVariant = (entry && entry.ownersByVariant && typeof entry.ownersByVariant === 'object')
    ? entry.ownersByVariant
    : null;

  return {
    pokemonKey: key,
    pokemonName: prettifyPokemonName(key),
    artSrc: getPokemonDbShinyGifSrc(key),
    points: points,
    infoText: infoText,
    isUnclaimed: count === 0,
    owners: ownersAll,
    ownersByVariant,
    variants: buildLivingVariants(entry, infoText, wantedVariant)
  };
}
