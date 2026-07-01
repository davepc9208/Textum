export const SITE_URL = process.env.SITE_URL!;

export const LOCALES = ["es", "en"] as const;

export type Locale = (typeof LOCALES)[number];