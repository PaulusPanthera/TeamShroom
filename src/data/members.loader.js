import { loadJson } from './json.loader.js';

export async function loadMembers() {
  return loadJson('/data/members.json');
}
