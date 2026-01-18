// src/domains/members/member.assets.js
// v2.0.0-beta
// Pure helpers for member assets (sprite + role emblem) shared across features.

function normalize(str) {
  return String(str || '').trim().toLowerCase();
}

export function normalizeMemberKey(name) {
  return normalize(name);
}

export function getMemberRoleEmblemSrc(role) {
  const r = normalize(role);
  if (r === 'spore') return 'img/symbols/sporesprite.png';
  if (r === 'shroom') return 'img/symbols/shroomsprite.png';
  if (r === 'shinyshroom') return 'img/symbols/shinyshroomsprite.png';
  return 'img/symbols/shroomsprite.png';
}

/**
 * Sprite source based on CI-driven sprite extension.
 *
 * Rules:
 * - spriteExt == null/empty => examplesprite.png
 * - spriteExt == 'png'/'gif'/... => <key>sprite.<ext>
 */
export function getMemberSpriteSrc(memberKey, spriteExt) {
  const key = normalize(memberKey);
  const ext = String(spriteExt || '').trim().toLowerCase();

  if (key && ext) return `img/membersprites/${key}sprite.${ext}`;
  return 'img/membersprites/examplesprite.png';
}
