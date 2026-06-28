import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Post = {
  id: string;
  slug: string;
  title_es: string;
  title_en: string;
  excerpt_es: string;
  excerpt_en: string;
  content_es: string;
  content_en: string;
  author: string;
  cover_url: string;
  cover_alt: string | null;
  published: boolean;
  created_at: string;
  reading_time: number;
  category: string | null;
};
