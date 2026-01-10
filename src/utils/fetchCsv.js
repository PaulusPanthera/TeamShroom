// src/utils/fetchCsv.js
export async function fetchCsv(url) {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Failed to fetch CSV: ${url}`)
  }

  const text = await res.text()
  return parseCsv(text)
}

function parseCsv(text) {
  const lines = text.trim().split('\n')
  const headers = lines.shift().split(',').map(h => h.trim())

  return lines.map(line => {
    const values = line.split(',')
    const row = {}
    headers.forEach((h, i) => {
      row[h] = (values[i] ?? '').trim()
    })
    return row
  })
}
