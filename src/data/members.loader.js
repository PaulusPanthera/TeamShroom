import { loadJson } from './json.loader.js';

export function loadMembers() {
  return loadJson('/data/members.json', 1);
}
