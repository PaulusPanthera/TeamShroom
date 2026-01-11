// membersprite.js
// Member Sprite Resolver
// Pure, synchronous, data-driven

/**
 * Resolve a member sprite URL.
 *
 * Contract:
 * - Always returns a STRING
 * - Never probes the filesystem
 * - Never throws
 * - Never returns Promise
 *
 * Expected member entry shape:
 * {
 *   name: "Paulus",
 *   sprite: "png" | "gif" | "jpg" | "none" | ""
 * }
 */
export function getMemberSprite(memberName, membersData = []) {
  if (!memberName) {
    return 'img/membersprites/examplesprite.png';
  }

  const nameLower = memberName.toLowerCase();

  const entry = membersData.find(
    m => m.name && m.name.toLowerCase() === nameLower
  );

  if (!entry || entry.sprite === 'none' || !entry.sprite) {
    return 'img/membersprites/examplesprite.png';
  }

  const base = entry.name.toLowerCase();

  return `img/membersprites/${base}sprite.${entry.sprite}`;
}
