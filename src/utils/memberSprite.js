import { normalizeMemberName } from './utils.js';

/**
 * Resolve the correct sprite URL for a member.
 *
 * Rules:
 * - Uses teamShowcase entry if available
 * - Falls back safely for ex-members
 */
export function getMemberSprite(memberName, teamShowcase = []) {
  const base = normalizeMemberName(memberName);

  const entry = teamShowcase.find(
    m => normalizeMemberName(m.name) === base
  );

  // Explicit opt-out
  if (entry?.sprite === 'none') {
    return 'img/membersprites/examplesprite.png';
  }

  // Explicit format
  if (entry?.sprite) {
    return `img/membersprites/${base}sprite.${entry.sprite}`;
  }

  // Auto-detect fallback (best effort)
  return tryFormats(base);
}

function tryFormats(base) {
  const formats = ['png', 'gif', 'jpg'];
  let index = 0;

  const img = new Image();
  img.src = 'img/membersprites/examplesprite.png';

  function probe(resolve) {
    if (index >= formats.length) {
      resolve('img/membersprites/examplesprite.png');
      return;
    }

    const url = `img/membersprites/${base}sprite.${formats[index++]}`;
    const test = new Image();

    test.onload = () => resolve(url);
    test.onerror = () => probe(resolve);
    test.src = url;
  }

  return new Promise(resolve => probe(resolve));
}
