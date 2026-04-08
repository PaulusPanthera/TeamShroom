// src/data/shinywar.loader.js
// v2.0.0-beta
// Shiny War config loader. Accepts either the standard JSON envelope or a direct config object.

export async function loadShinyWarConfig() {
  const path = 'data/shinywar.json';
  const res = await fetch(path, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Failed to load ${path}`);
  }

  const payload = await res.json();

  if (!payload || typeof payload !== 'object') {
    throw new Error(`Invalid JSON payload: ${path}`);
  }

  if (Array.isArray(payload.data) && payload.data.length) {
    return payload.data[0] || null;
  }

  if (payload.title || Array.isArray(payload.teams) || Array.isArray(payload.rules)) {
    return payload;
  }

  throw new Error(`Missing usable Shiny War config in ${path}`);
}
