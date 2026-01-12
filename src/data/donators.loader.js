// src/data/donators.loader.js
// Donators data loader
//
// INTERNAL DATA CONTRACT — DONATOR ROW (CI-OWNED)
//
// Each entry in donators.json.data[] has the following shape:
//
// {
//   date: string                  // ISO date string (YYYY-MM-DD)
//   name: string                  // donor display name
//   donation: string | null       // donated item name, if applicable
//   value: number                 // numeric value of this single entry
// }
//
// Guarantees:
// - All fields are always present
// - `donation` may be null but is never missing
// - `value` represents a single row value, not an aggregate
// - Multiple rows per donor may exist
// - Rows are pre-normalized by CI
// - No runtime reshaping or validation occurs

import { loadJson } from './json.loader.js';

export function loadDonators() {
  return loadJson('/data/donators.json', 1);
}
