// src/data/donators.loader.js
// Donators data loader
//
// INTERNAL DATA CONTRACT — DONATOR ROW
//
// Each entry in donators.json.data[] has the following shape:
//
// {
//   name: string                   // donor display name
//   amount: number                 // total donated amount
//   tier: string                   // computed or assigned donor tier
// }
//
// Guarantees:
// - All fields are required and always present
// - `amount` is a numeric total, not per-donation
// - Rows are pre-normalized by CI
// - No runtime reshaping or validation occurs

import { loadJson } from './json.loader.js';

export function loadDonators() {
  return loadJson('/data/donators.json', 1);
}
