export function normalizeKeywords(value: string | null | undefined): string;

export interface EditorialSheet {
  title: string;
  subtitle: string;
  seoTitle: string;
  metaDescription: string;
  excerpt: string;
  keywords: string;
  slug: string;
  author: string;
  category: string;
}

export function parseEditorialSheet(text: string): EditorialSheet;
