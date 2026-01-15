// scripts/lib/writeJson.mjs
// CI JSON writer — versioned payloads only

import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Write a JSON file with stable formatting.
 *
 * @param {string} outputPath - relative path (e.g. data/members.json)
 * @param {object} payload   - { version, generatedAt, source, data }
 */
export async function writeJson(outputPath, payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('writeJson: payload must be an object');
  }

  const fullPath = path.resolve(outputPath);

  await fs.writeFile(
    fullPath,
    JSON.stringify(payload, null, 2) + '\n',
    'utf8'
  );
}
