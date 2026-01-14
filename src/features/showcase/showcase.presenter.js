// src/features/showcase/showcase.presenter.js
// v2.0.0-beta
// Showcase presenter (sorting + filtering + view shapes)

import { prettifyPokemonName } from '../../utils/utils.js';

function normalize(str) {
  return String(str || '').trim().toLowerCase();
}

export function filterMembers(members, search) {
  const q = normalize(search);
  if (!q) return Array.isArray(members) ? members : [];
  return (Array.isArray(members) ? members : []).filter(m => normalize(m && m.name).includes(q));
}

export function sortMembers(members, sortMode) {
  const list = Array.isArray(members) ? [...members] : [];

  if (sortMode === 'scoreboard') {
    return list.sort((a, b) => (Number(b.points) || 0) - (Number(a.points) || 0));
  }

  if (sortMode === 'shinies') {
    return list.sort((a, b) => (Number(b.shinyCount) || 0) - (Number(a.shinyCount) || 0));
  }

  return list.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
}

export function buildMemberGalleryCardView(member, membersForSprites, sortMode) {
  const name = member && member.name ? String(member.name) : '';
  const key = member && member.key ? String(member.key) : '';

  const infoText =
    sortMode === 'scoreboard'
      ? `Points: ${(Number(member && member.points) || 0).toLocaleString('en-US')}`
      : `Shinies: ${(Number(member && member.shinyCount) || 0).toLocaleString('en-US')}`;

  // Member cards teach the variant system but only standard is interactive.
  const variants = [
    { key: 'standard', title: 'Standard', enabled: true, infoText: infoText, active: true },
    { key: 'secret', title: 'Secret', enabled: false, infoText: infoText, active: false },
    { key: 'alpha', title: 'Alpha', enabled: false, infoText: infoText, active: false },
    { key: 'safari', title: 'Safari', enabled: false, infoText: infoText, active: false }
  ];

  return {
    memberKey: key,
    pokemonKey: key,
    pokemonName: name,
    artMemberKey: key,
    membersForSprites,
    points: Number(member && member.points) || 0,
    infoText,
    isUnclaimed: false,
    variants
  };
}

export function buildMemberShinyCardView(shiny, pokemonPoints) {
  const pokemonKey = shiny && shiny.pokemon ? String(shiny.pokemon) : '';
  const points = Number(pokemonPoints && pokemonPoints[pokemonKey]) || 0;

  let info = '';
  if (shiny && shiny.lost) info = 'Lost';
  else if (shiny && shiny.sold) info = 'Sold';

  const tags = [];
  if (shiny && shiny.secret) tags.push('Secret');
  if (shiny && shiny.alpha) tags.push('Alpha');
  if (shiny && shiny.run) tags.push('Run');
  if (shiny && shiny.favorite) tags.push('Fav');

  if (!info && tags.length) info = tags.join(' • ');
  else if (info && tags.length) info = `${info} • ${tags.join(' • ')}`;

  const variants = [
    { key: 'standard', title: 'Standard', enabled: true, infoText: info, active: true },
    { key: 'secret', title: 'Secret', enabled: false, infoText: info, active: false },
    { key: 'alpha', title: 'Alpha', enabled: false, infoText: info, active: false },
    { key: 'safari', title: 'Safari', enabled: false, infoText: info, active: false }
  ];

  return {
    pokemonKey,
    pokemonName: prettifyPokemonName(pokemonKey),
    points,
    infoText: info,
    isUnclaimed: Boolean(shiny && (shiny.lost || shiny.sold)),
    clip: shiny && shiny.clip ? String(shiny.clip) : null,
    variants
  };
}
