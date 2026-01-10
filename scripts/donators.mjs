import { fetchCsv } from './lib/fetchCsv.mjs';
import { parseCsv } from './lib/parseCsv.mjs';
import { writeJson } from './lib/writeJson.mjs';

const CSV_URL = process.env.DONATORS_CSV;

const csvText = await fetchCsv(CSV_URL);
const rows = parseCsv(csvText);

const normalized = rows.map(row => ({
  name: row.name,
  amount: row.amount,
  note: row.note,
}));

await writeJson('data/donators.json', normalized);
