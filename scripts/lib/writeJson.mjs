import fs from 'fs/promises';

export async function writeJson(path, data) {
  const json = JSON.stringify(data, null, 2);
  await fs.writeFile(path, json, 'utf8');
}
