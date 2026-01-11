// utils.js
// Centralized display helpers
// Runtime-safe, CSV-free

/* ---------------------------------------------------------
   POKÉMON NAME HELPERS
--------------------------------------------------------- */

/**
 * Normalize a Pokémon name into a canonical lookup key.
 *
 * NOTE:
 * - Mostly legacy
 * - Kept for safety during migration
 */
export function normalizePokemonName(name) {
  if (!name) return "";
  return name
    .toLowerCase()
    .replace(/♀/g, "-f")
    .replace(/♂/g, "-m")
    .replace(/[\s.'’]/g, "");
}

/**
 * Prettify a Pokémon name for display only.
 *
 * NEVER use this for logic or lookups.
 */
export function prettifyPokemonName(input) {
  if (!input) return "";

  const raw = input.toLowerCase();

  if (raw === "nidoran-f" || raw === "nidoranf") return "Nidoran♀";
  if (raw === "nidoran-m" || raw === "nidoranm") return "Nidoran♂";
  if (raw === "mr.mime" || raw === "mrmime") return "Mr. Mime";
  if (raw === "mime-jr" || raw === "mimejr") return "Mime Jr.";
  if (raw === "type-null" || raw === "typenull") return "Type: Null";
  if (raw === "porygon-z" || raw === "porygonz") return "Porygon-Z";

  return raw
    .replace(/-/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase());
}
