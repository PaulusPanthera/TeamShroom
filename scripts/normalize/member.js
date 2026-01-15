export function normalizeMember(name) {
  return name.trim().toLowerCase().replace(/\s+/g, '');
}
