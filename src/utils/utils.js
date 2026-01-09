// utils.js
// Centralized normalization & display helpers
// Design System v1 — deterministic, boring, explicit

/* ---------------------------------------------------------
   POKÉMON NAME HELPERS
--------------------------------------------------------- */

/**
 * Normalize a Pokémon name into a canonical lookup key.
 *
 * CONTRACT (DO NOT BREAK):
 * - Output is used as a stable key across:
 *   - points
 *   - tiers
 *   - families
 *   - regions
 * - Must remain deterministic forever.
 *
 * Rules:
 * - lowercase
 * - gender symbols → -f / -m
 * - remove spaces, dots, quotes
 * - KEEP hyphens (important for forms like porygon-z)
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
 * Accepts:
 * - raw names (e.g. "mr.mime")
 * - normalized keys (e.g. "porygonz")
 *
 * NEVER use this for logic or lookups.
 */
export function prettifyPokemonName(input) {
  if (!input) return "";

  const raw = input.toLowerCase();

  // Explicit exceptions (stable & intentional)
  if (raw === "nidoran-f" || raw === "nidoranf") return "Nidoran♀";
  if (raw === "nidoran-m" || raw === "nidoranm") return "Nidoran♂";
  if (raw === "mr.mime" || raw === "mrmime") return "Mr. Mime";
  if (raw === "mime-jr" || raw === "mimejr") return "Mime Jr.";
  if (raw === "type-null" || raw === "typenull") return "Type: Null";
  if (raw === "porygon-z" || raw === "porygonz") return "Porygon-Z";

  // Default: hyphens → spaces, title case
  return raw
    .replace(/-/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase());
}

/* ---------------------------------------------------------
   MEMBER NAME HELPERS
--------------------------------------------------------- */

/**
 * Normalize a member name for file paths and IDs.
 * Example: avatar filenames, internal keys.
 */
export function normalizeMemberName(name) {
  if (!name) return "";
  return name.trim().toLowerCase().replace(/\s+/g, "");
}

/**
 * Prettify a member name for display only.
 * Logic-free, cosmetic.
 */
export function prettifyMemberName(name) {
  if (!name) return "";
  return name.replace(/\b\w/g, c => c.toUpperCase());
}
