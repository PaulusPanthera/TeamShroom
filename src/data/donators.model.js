// src/data/donators.model.js
// Donators Model — HARD CONTRACT

export function buildDonatorsModel(rows) {
  if (!Array.isArray(rows)) return [];

  return rows.map(r => ({
    date: r.date,
    name: r.name,
    donation: r.donation,
    value: Number(r.value) || 0
  }));
}
