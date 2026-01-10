import { fetchCsv } from './lib/fetchCsv.mjs';
import { parseCsv } from './lib/parseCsv.mjs';
import { writeJson } from './lib/writeJson.mjs';

const CSV_URL = process.env.MEMBERS_CSV;

const csvText = await fetchCsv(CSV_URL);
const rows = parseCsv(csvText);

const normalized = rows.map(row => ({
  id: row.id,
  name: row.name,
  status: row.status,
}));

await writeJson('data/members.json', normalized);

