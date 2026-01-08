// utils.js
// Centralized normalization and prettification helpers for Pokémon and members
// Exports:
//  - normalizePokemonName(name)  -> canonical id-like string (hyphenated where appropriate)
//  - prettifyPokemonName(raw)    -> display-friendly name (with proper symbols/casing)
//  - normalizeMemberName(name)   -> compact lowercased identifier for members
//  - prettifyMemberName(name)    -> display-friendly member name

// Map of canonical tokens to pretty display strings (exceptions)
const PRETTY_EXCEPTIONS = {
  'nidoran-f': 'Nidoran♀',
  'nidoran-m': 'Nidoran♂',
  'mr-mime': 'Mr. Mime',
  'mime-jr': 'Mime Jr.',
  'type-null': 'Type: Null',
  'porygon-z': 'Porygon-Z',
  'farfetchd': "Farfetch'd",
  'porygon2': 'Porygon2'
};

const CANONICAL_MAP = {
  'nidoran f': 'nidoran-f',
  'nidoran m': 'nidoran-m',
  'nidoranf': 'nidoran-f',
  'nidoranm': 'nidoran-m',
  'mr mime': 'mr-mime',
  'mr. mime': 'mr-mime',
  'mr-mime': 'mr-mime',
  'mime jr': 'mime-jr',
  'mimejr': 'mime-jr',
  "farfetch'd": 'farfetchd',
  "farfetchd": 'farfetchd',
  'type null': 'type-null',
  'typenull': 'type-null',
  'porygon z': 'porygon-z',
  'porygonz': 'porygon-z',
  'ivysaur ss': 'ivysaur',
  'ss loudred': 'loudred'
};

/**
 * Normalize a Pokémon name for consistent key usage (e.g., lookups).
 * Returns a lowercased, hyphen-aware canonical string safe for filenames/keys.
 */
export function normalizePokemonName(name) {
  if (!name && name !== 0) return '';
  let s = String(name).trim().toLowerCase();

  // Normalize unicode gender symbols to text (prefer hyphen form)
  s = s.replace(/\u2640/g, ' f').replace(/\u2642/g, ' m');

  // Remove parenthetical notes entirely (e.g., "(safari)"), they'll be separate flags
  s = s.replace(/\(.*?\)/g, '');

  // Remove stray punctuation we don't want in canonical tokens (keep hyphens)
  s = s.replace(/[’'`"•]/g, '');

  // Normalize multiple whitespace to single space
  s = s.replace(/\s+/g, ' ').trim();

  // Map common spaced variants before converting spaces to hyphens
  if (CANONICAL_MAP[s]) return CANONICAL_MAP[s];

  // Convert spaces to hyphen (so "nidoran f" -> "nidoran-f")
  s = s.replace(/\s+/g, '-');

  // Remove any characters that are not alphanumeric or hyphen
  s = s.replace(/[^a-z0-9\-]/g, '');

  // Final map pass for any leftover oddities
  if (CANONICAL_MAP[s]) return CANONICAL_MAP[s];

  return s;
}

/**
 * Prettify a Pokémon name for display.
 * Accepts raw input (from JSON) and returns a nicely formatted string.
 */
export function prettifyPokemonName(raw) {
  if (!raw && raw !== 0) return '';
  // Use normalization to get canonical token
  const canonical = normalizePokemonName(raw);

  // Known pretty exceptions first
  if (PRETTY_EXCEPTIONS[canonical]) return PRETTY_EXCEPTIONS[canonical];

  // Fallback: turn hyphens into spaces and Title Case each word
  const withSpaces = canonical.replace(/-/g, ' ').trim();

  if (!withSpaces) return String(raw).trim();

  return withSpaces.replace(/\b[a-z]/g, ch => ch.toUpperCase());
}

/**
 * Normalize a member name for e.g. avatar paths or keys.
 * Removes whitespace and lowercases.
 */
export function normalizeMemberName(name) {
  if (!name && name !== 0) return '';
  return String(name).trim().toLowerCase().replace(/\s+/g, '');
}

/**
 * Prettify member name for display (simple Title Case).
 */
export function prettifyMemberName(name) {
  if (!name && name !== 0) return '';
  return String(name).trim().replace(/\b[a-z]/g, ch => ch.toUpperCase());
}
