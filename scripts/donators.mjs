import { fetchCsv } from './lib/fetchCsv.mjs';
import { parseCsv } from './lib/parseCsv.mjs';
import { writeJson } from './lib/writeJson.mjs';

const CSV_URL = process.env.DONATORS_CSV;

function normalizeDate(value, rowIndex) {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`Row ${rowIndex + 2}: invalid date "${value}"`);
  }
  return value;
}

function normalizeValue(value, rowIndex) {
  if (!value) {
    throw new Error(`Row ${rowIndex + 2}: missing value`);
  }

  const cleaned = value.replace(/\./g, '');
  const num = Number(cleaned);

  if (!Number.isInteger(num) || num < 0) {
    throw new Error(`Row ${rowIndex + 2}: invalid value "${value}"`);
  }

  return num;
}

function normalizeString(value) {
  const v = value?.trim();
  return v ? v : null;
}

const csvText = await fetchCsv(CSV_URL);
const rows = parseCsv(csvText);

const normalized = rows
  // ✅ EMPTY ROW FIX — PRIMARY FIELD = DATE
  .filter(row => row.date && row.date.trim() !== '')
  .map((row, index) => {
    const name = row.name?.trim();
    if (!name) {
      throw new Error(`Row ${index + 2}: missing name`);
    }

    return {
      date: normalizeDate(row.date, index),
      name,
      donation: normalizeString(row.donation),
      value: normalizeValue(row.value, index),
    };
  });

await writeJson('data/donators.json', normalized);
