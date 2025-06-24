// utils.js
// Centralized normalization and prettification helpers for Pokémon and members

// Normalize a Pokémon name for consistent key usage (e.g., for lookups)
export function normalizePokemonName(name) {
  return (
    name
      .toLowerCase()
      .replace(/♀/g, "-f")
      .replace(/♂/g, "-m")
      .replace(/[\s.'’]/g, "")
      .replace(/-/g, "")
  );
}

// Prettify a Pokémon name for display
export function prettifyPokemonName(raw) {
  // Handle exceptions first
  if (raw === "nidoran-f" || raw === "nidoranf") return "Nidoran♀";
  if (raw === "nidoran-m" || raw === "nidoranm") return "Nidoran♂";
  if (raw === "mr.mime" || raw === "mrmime") return "Mr. Mime";
  if (raw === "mime-jr" || raw === "mimejr") return "Mime Jr.";
  if (raw === "type-null" || raw === "typenull") return "Type: Null";
  if (raw === "porygon-z" || raw === "porygonz") return "Porygon-Z";
  // Add more exceptions if needed.
  return raw
    .replace(/-/g," ")
    .replace(/\b\w/g, l => l.toUpperCase());
}

// Normalize a member name (for e.g. avatar paths)
export function normalizeMemberName(name) {
  return name.trim().toLowerCase().replace(/\s+/g, "");
}

// Prettify member name (optional, e.g. for display)
export function prettifyMemberName(name) {
  return name.replace(/\b\w/g, l => l.toUpperCase());
}
