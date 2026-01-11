import { fetchCsv } from './lib/fetchCsv.mjs';
import { parseCsv } from './lib/parseCsv.mjs';
import { writeJson } from './lib/writeJson.mjs';

const CSV_URL = process.env.SHINY_WEEKLY_CSV;

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
  'event',
  'headbutt',
  'rocksmash',
  'sos',
  'honeytree',
  'fishing',
]);

function normalizeBool(value) {
  return value === 'TRUE';
}

function normalizeString(value) {
  const v = value?.trim();
  return v === '' || v == null ? null : v;
}

function normalizeDate(value, rowIndex, field) {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`Row ${rowIndex + 2}: invalid ${field} "${value}"`);
  }
  return value;
}

function normalizeEncounter(value, rowIndex) {
  if (!value) return null;
  const num = Number(value);
  if (!Number.isInteger(num) || num < 0) {
    throw new Error(`Row ${rowIndex + 2}: invalid encounter "${value}"`);
  }
  return num;
}

function normalizeMethod(value, rowIndex) {
  if (!value) return null;
  const method = value.trim().toLowerCase();
  if (!ALLOWED_METHODS.has(method)) {
    throw new Error(`Row ${rowIndex + 2}: invalid method "${value}"`);
  }
  return method;
}

function normalizeClip(value) {
  const v = value?.trim();
  if (!v) return null;
  if (!/^https?:\/\//i.test(v)) return null;
  return v;
}

const csvText = await fetchCsv(CSV_URL);
const rows = parseCsv(csvText);

const normalized = rows
  .filter(row => row.week && row.week.trim() !== '')
  .map((row, index) => {
    const week = row.week.trim();

    return {
      week,
      week_label: normalizeString(row.week_label),
      date_start: normalizeDate(row.date_start, index, 'date_start'),
      date_end: normalizeDate(row.date_end, index, 'date_end'),
      date_catch: normalizeDate(row.date_catch, index, 'date_catch'),
      ot: normalizeString(row.ot),
      pokemon: row.pokemon?.trim().toLowerCase() || null,
      method: normalizeMethod(row.method, index),
      encounter: normalizeEncounter(row.encounter, index),
      secret: normalizeBool(row.secret),
      alpha: normalizeBool(row.alpha),
      run: normalizeBool(row.run),
      lost: normalizeBool(row.lost),
      clip: normalizeClip(row.clip),
      notes: normalizeString(row.notes),
    };
  });


await writeJson('data/shinyweekly.json', normalized);
