export type SeoPost = {
  slug: string;
  slug_es: string | null;
  slug_en: string | null;

  title_es: string;
  title_en: string;

  excerpt_es: string | null;
  excerpt_en: string | null;

  keywords_es: string | null;
  keywords_en: string | null;

  author: string | null;
  created_at: string;

  cover_url: string | null;
  cover_url_es: string | null;
  cover_url_en: string | null;
  category: string | null;
  collection_type: string | null;
  reading_time: number | null;
};