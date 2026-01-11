export async function writeJson(path, payload) {
  await fs.writeFile(
    path,
    JSON.stringify(payload, null, 2),
    'utf8'
  );
}
