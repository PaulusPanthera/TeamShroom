// src/utils/utils.js
// Display helpers only
// Runtime-safe, logic-free

/* ---------------------------------------------------------
   POKÉMON DISPLAY HELPERS
--------------------------------------------------------- */

/**
 * Prettify a Pokémon name for display only.
 *
 * INPUT:
 * - canonical Pokémon key (from CI)
 *
 * OUTPUT:
 * - human-readable label
 *
 * NEVER use for:
 * - lookups
 * - comparisons
 * - normalization
 */
export function prettifyPokemonName(input) {
  if (!input) return "";

  const raw = input.toLowerCase();

  // Explicit exceptions (stable)
  if (raw === "nidoran-f") return "Nidoran♀";
  if (raw === "nidoran-m") return "Nidoran♂";
  if (raw === "mr.mime" || raw === "mrmime") return "Mr. Mime";
  if (raw === "mime-jr" || raw === "mimejr") return "Mime Jr.";
  if (raw === "type-null" || raw === "typenull") return "Type: Null";
  if (raw === "porygon-z" || raw === "porygonz") return "Porygon-Z";

  return raw
    .replace(/-/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase());
}
