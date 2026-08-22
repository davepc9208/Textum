import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. Copia .env.example a .env y rellena los valores de Supabase.',
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const POST_SUMMARY_FIELDS = [
  'id', 'slug', 'title_es', 'title_en', 'excerpt_es', 'excerpt_en',
  'author', 'cover_url', 'cover_alt', 'published', 'created_at',
  'reading_time', 'category', 'collection_type',
].join(',');

export type PostCursor = Pick<Post, 'created_at' | 'id'>;

export type Post = {
  id: string;
  slug: string;
  title_es: string;
  title_en: string;
  excerpt_es: string;
  excerpt_en: string;
  content_es: string;
  content_en: string;
  keywords_es: string;
  keywords_en: string;
  author: string;
  cover_url: string;
  cover_alt: string | null;
  published: boolean;
  created_at: string;
  reading_time: number;
  category: string | null;
  collection_type: string | null;
};
