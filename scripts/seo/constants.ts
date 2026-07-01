import dotenv from "dotenv";

dotenv.config({ path: ".env.seo" });

export const SITE_URL = process.env.SITE_URL;
export const LOCALES = ["es", "en"] as const;
export type Locale = (typeof LOCALES)[number];

if (!SITE_URL) {
  throw new Error("❌ SITE_URL no definida en .env.seo");
}