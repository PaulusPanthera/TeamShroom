// src/features/showcase/showcase.presenter.js
// v2.0.0-beta
// Showcase presenter (sorting + filtering + view shapes)

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

function tierEmblemForRole(role) {
  const r = normalize(role);
  if (r === 'spore') return 'img/symbols/sporesprite.png';
  if (r === 'shroom') return 'img/symbols/shroomsprite.png';
  if (r === 'shinyshroom') return 'img/symbols/shinyshroomsprite.png';
  return 'img/symbols/shroomsprite.png';
}

function spriteSrcForMember(member) {
  const key = member && member.key ? String(member.key) : '';
  const ext = member && member.sprite ? String(member.sprite) : '';
  if (key && ext) return `img/membersprites/${key}sprite.${ext}`;
  return 'img/membersprites/examplesprite.png';
}

export function buildMemberGalleryCardView(member, sortMode) {
  const name = member && member.name ? String(member.name) : '';
  const key = member && member.key ? String(member.key) : '';

  return {
    memberKey: key,
    name,
    points: Number(member && member.points) || 0,
    tierEmblemSrc: tierEmblemForRole(member && member.role),
    spriteSrc: spriteSrcForMember(member),
    sortMode
  };
}
