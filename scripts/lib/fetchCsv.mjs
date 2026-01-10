export async function fetchCsv(url) {
  if (!url) {
    throw new Error('CSV URL is missing');
  }

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch CSV: ${response.status}`);
  }

  return response.text();
}
