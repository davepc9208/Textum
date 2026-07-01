export type SeoPost = {
  slug: string;

  title_es: string;
  title_en: string;

  excerpt_es: string | null;
  excerpt_en: string | null;

  author: string | null;
  created_at: string;

  cover_url: string | null;
  category: string | null;
  reading_time: number | null;
};