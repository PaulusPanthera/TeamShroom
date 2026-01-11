// membersprite.js
// Member Sprite Resolver
// Runtime-only, identity-safe

/**
 * Resolve a member sprite URL.
 *
 * Contract:
 * - Always returns a STRING
 * - Never throws
 * - Never normalizes
 *
 * Expected member entry shape:
 * {
 *   name: "Paulus",
 *   key: "paulus",
 *   sprite: "png" | "gif" | "jpg" | null
 * }
 */
export function getMemberSprite(memberKey, membersData = []) {
  if (!memberKey) {
    return 'img/membersprites/examplesprite.png';
  }

  const entry = membersData.find(m => m.key === memberKey);

  if (!entry || !entry.sprite) {
    return 'img/membersprites/examplesprite.png';
  }

  return `img/membersprites/${entry.key}sprite.${entry.sprite}`;
}
