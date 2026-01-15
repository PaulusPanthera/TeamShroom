// src/utils/utils.js
// v2.0.0-beta
// Display helpers + PokéDB sprite key mapping used by UI features.

/* ---------------------------------------------------------
   POKÉMON DISPLAY HELPERS
--------------------------------------------------------- */

/**
 * Prettify a Pokémon name for display only.
 *
 * INPUT:
 * - canonical Pokémon key (already normalized in CI)
 *   e.g. "porygon-z", "mr-mime", "nidoran-f"
 *
 * OUTPUT:
 * - human-readable label
 *
 * CONTRACT:
 * - MUST NOT be used for lookups
 * - MUST NOT be used for comparisons
 * - MUST NOT be used for normalization
 */
export function prettifyPokemonName(input) {
  if (!input) return '';

  const raw = String(input).toLowerCase();

  // Explicit, stable exceptions
  if (raw === 'nidoran-f' || raw === 'nidoranf') return 'Nidoran♀';
  if (raw === 'nidoran-m' || raw === 'nidoranm') return 'Nidoran♂';
  if (raw === 'mr-mime' || raw === 'mrmime') return 'Mr. Mime';
  if (raw === 'mime-jr' || raw === 'mimejr') return 'Mime Jr.';
  if (raw === 'type-null' || raw === 'typenull') return 'Type: Null';
  if (raw === 'porygon-z' || raw === 'porygonz') return 'Porygon-Z';

  // Default: hyphens → spaces, title case
  return raw
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

/* ---------------------------------------------------------
   POKÉDB SPRITE KEY MAPPER

   Problem:
   - Internal Pokémon keys are CI-owned.
   - PokéDB sprite URLs require specific hyphenated keys for some edge species.
   - UI features must not duplicate override maps.

   Contract:
   - Input can be either canonical ("mr-mime") or legacy ("mrmime").
   - Output must match PokéDB URL key.
--------------------------------------------------------- */

export function toPokemonDbSpriteKey(input) {
  const raw = String(input || '').trim().toLowerCase();
  if (!raw) return '';

  const overrides = {
    // Mr. Mime / Mime Jr.
    mrmime: 'mr-mime',
    'mr-mime': 'mr-mime',
    mimejr: 'mime-jr',
    'mime-jr': 'mime-jr',

    // Type: Null
    typenull: 'type-null',
    'type-null': 'type-null',

    // Porygon-Z
    porygonz: 'porygon-z',
    'porygon-z': 'porygon-z',

    // Nidoran forms (some sources drop the hyphen)
    nidoranf: 'nidoran-f',
    'nidoran-f': 'nidoran-f',
    nidoranm: 'nidoran-m',
    'nidoran-m': 'nidoran-m'
  };

  return overrides[raw] || raw;
}

export function getPokemonDbShinyGifSrc(pokemonKey) {
  const key = toPokemonDbSpriteKey(pokemonKey);
  if (!key) return '';
  return `https://img.pokemondb.net/sprites/black-white/anim/shiny/${key}.gif`;
}
