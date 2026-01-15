// src/data/json.loader.js
// Runtime JSON loader — trust boundary
//
// INTERNAL DATA CONTRACT — JSON ENVELOPE
//
// All JSON files loaded through this function must have the shape:
//
// {
//   version: number,               // schema version, compared strictly
//   generatedAt: string,           // ISO timestamp (not used at runtime)
//   source: string,                // data source identifier (not used at runtime)
//   data: Array<any>               // dataset-specific rows
// }
//
// Guarantees after this function returns:
// - `data` is always an array
// - `version` exactly matches `expectedVersion`
// - The returned value is `payload.data` only
// - Callers never receive the envelope object
//
// Failure behavior:
// - Throws immediately on fetch failure
// - Throws on invalid JSON
// - Throws on version mismatch
// - Throws if `data` is not an array
//
// This function defines the runtime trust boundary:
// - JSON is assumed pre-normalized by CI
// - No runtime data reshaping occurs
// - Downstream code may rely on declared dataset contracts

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
