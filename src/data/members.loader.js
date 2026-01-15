// src/data/members.loader.js
// Members data loader
//
// INTERNAL DATA CONTRACT — MEMBER ROW (CI-OWNED)
//
// Each entry in members.json.data[] has the following shape:
//
// {
//   name: string                  // display name (case-preserved)
//   active: boolean               // active member flag
//   role: string                  // role identifier (e.g. "spore", "shroom")
//   sprite: string | null         // sprite file extension or null
// }
//
// Guarantees:
// - All fields are always present
// - `sprite` may be null but is never missing
// - Rows are pre-normalized by CI
// - No runtime reshaping or validation occurs

import { loadJson } from './json.loader.js';

export function loadMembers() {
  return loadJson('/data/members.json', 1);
}
