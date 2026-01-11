import { loadJson } from './loadJson.js';

export function loadMembers() {
  return loadJson('/data/members.json', 1);
}
