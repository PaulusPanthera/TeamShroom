// src/data/members.loader.js
// v2.0.0-beta
// Members data loader. Documents the CI-owned members.json row contract including roster metadata.
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
//   member_since: string          // roster join date as dd.mm.yy, or ""
//   nationality: string           // optional nationality text, or ""
// }
//
// Guarantees:
// - All fields are always present
// - `sprite` may be null but is never missing
// - `member_since` and `nationality` may be empty strings but are never missing
// - Rows are pre-normalized by CI
// - No runtime reshaping or validation occurs

import { loadJson } from './json.loader.js';

export function loadMembers() {
  return loadJson('data/members.json', 1);
}
