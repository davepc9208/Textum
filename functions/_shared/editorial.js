export function normalizeKeywords(value) {
  return (value ?? '')
    .split(/[;,]/)
    .map(keyword => keyword.trim())
    .filter(Boolean)
    .join(', ');
}
