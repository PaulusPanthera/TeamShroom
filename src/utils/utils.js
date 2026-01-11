// src/utils/utils.js
// Display helpers only
// Runtime-safe, logic-free
// Phase 3: CI-normalized data, runtime trusts JSON

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

  const raw = input.toLowerCase();

  // Explicit, stable exceptions
  if (raw === 'nidoran-f') return 'Nidoran♀';
  if (raw === 'nidoran-m') return 'Nidoran♂';
  if (raw === 'mr-mime' || raw === 'mrmime') return 'Mr. Mime';
  if (raw === 'mime-jr' || raw === 'mimejr') return 'Mime Jr.';
  if (raw === 'type-null' || raw === 'typenull') return 'Type: Null';
  if (raw === 'porygon-z' || raw === 'porygonz') return 'Porygon-Z';

  // Default: hyphens → spaces, title case
  return raw
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}
