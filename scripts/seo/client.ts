import dotenv from "dotenv";
dotenv.config({ path: ".env.seo" });

import { createClient } from "@supabase/supabase-js";
import type { SeoPost } from "./types.js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase env variables");
}

const supabase = createClient(supabaseUrl, supabaseKey);

export async function getPosts(): Promise<SeoPost[]> {
  const { data, error } = await supabase
    .from("posts")
    .select(`
      slug,
      title_es,
      title_en,
      excerpt_es,
      excerpt_en,
      author,
      created_at,
      cover_url,
      category,
      reading_time
    `)
    .eq("published", true)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}