const STORAGE_PREFIX = 'textum_experiment_';

export function getExperimentVariant(key: string, variants: string[]) {
  if (variants.length === 0) return '';
  try {
    const storageKey = `${STORAGE_PREFIX}${key}`;
    const existing = localStorage.getItem(storageKey);
    if (existing && variants.includes(existing)) return existing;
    const variant = variants[Math.floor(Math.random() * variants.length)];
    localStorage.setItem(storageKey, variant);
    return variant;
  } catch {
    return variants[0];
  }
}
