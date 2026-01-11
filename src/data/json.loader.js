// src/data/json.loader.js
// Runtime JSON loader — trust boundary

export async function loadJson(path, expectedVersion) {
  const res = await fetch(path);
  if (!res.ok) {
    throw new Error(`Failed to load ${path}`);
  }

  const payload = await res.json();

  if (!payload || typeof payload !== 'object') {
    throw new Error(`Invalid JSON payload: ${path}`);
  }

  if (payload.version !== expectedVersion) {
    throw new Error(
      `JSON version mismatch for ${path}: ` +
      `expected ${expectedVersion}, got ${payload.version}`
    );
  }

  if (!Array.isArray(payload.data)) {
    throw new Error(`Missing data array in ${path}`);
  }

  return payload.data;
}
