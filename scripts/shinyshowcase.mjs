import { fetchCsv } from './lib/fetchCsv.mjs';
import { parseCsv } from './lib/parseCsv.mjs';
import { writeJson } from './lib/writeJson.mjs';

const CSV_URL = process.env.SHINYSHOWCASE_CSV;

const ALLOWED_METHODS = new Set([
  'mpb',
  'mgb',
  'mub',
  'mcb',
  'mdb',
  'egg',
  'safari',
  '5x100%',
  '3x100%',
  'single',
  'swarm',
  'alpha_spawn',
  'raid',
  'headbutt',
  'rocksmash',
  'sos',
  'honeytree',
  'fishing',
  'event',
]);

function normalizeBool(v) {
  return v === 'TRUE';
}

function normalizeString(v) {
  const s = v?.trim();
  return s ? s : null;
}

function normalizeDate(v, rowIndex) {
  if (!v) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) {
    throw new Error(`Row ${rowIndex + 2}: invalid date_catch "${v}"`);
  }
  return v;
}

function normalizeEncounter(v, rowIndex) {
  if (!v) return null;
  const n = Number(v);
  if (!Number.isInteger(n) || n < 0) {
    throw new Error(`Row ${rowIndex + 2}: invalid encounter "${v}"`);
  }
  return n;
}

function normalizeMethod(v, rowIndex) {
  if (!v) return null;
  const m = v.trim().toLowerCase();
  if (!ALLOWED_METHODS.has(m)) {
    throw new Error(`Row ${rowIndex + 2}: invalid method "${v}"`);
  }
  return m;
}

function normalizeClip(v) {
  const s = v?.trim();
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) return null;
  return s;
}

const csvText = await fetchCsv(CSV_URL);
const rows = parseCsv(csvText);

const normalized = rows
  // ✅ PRIMARY FIELD FIX — OT
  .filter(row => row.ot && row.ot.trim() !== '')
  .map((row, index) => ({
    date_catch: normalizeDate(row.date_catch, index),
    ot: normalizeString(row.ot),
    pokemon: row.pokemon?.trim().toLowerCase() || null,
    method: normalizeMethod(row.method, index),
    encounter: normalizeEncounter(row.encounter, index),
    secret: normalizeBool(row.secret),
    alpha: normalizeBool(row.alpha),
    run: normalizeBool(row.run),
    lost: normalizeBool(row.lost),
    sold: normalizeBool(row.sold),
    favorite: normalizeBool(row.favorite),
    clip: normalizeClip(row.clip),
    notes: normalizeString(row.notes),
  }));

await writeJson('data/shinyshowcase.json', normalized);
