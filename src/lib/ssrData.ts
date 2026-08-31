// src/lib/ssrData.ts
// Lee el "data island" que las funciones SSR (functions/blog|colecciones)
// dejan en <script id="__SSR_DATA__">. Permite que PostPage / ColeccionPiecePage
// pinten el artículo sin volver a pedirlo a Supabase en la primera carga.

import type { Post } from './supabase';

type SsrIsland =
  | { type: 'post'; post: Post }
  | { type: 'coleccion'; tipo: string; post: Post };

let parsed: SsrIsland | null | undefined;

function read(): SsrIsland | null {
  if (parsed !== undefined) return parsed;
  parsed = null;
  try {
    const el = typeof document !== 'undefined' ? document.getElementById('__SSR_DATA__') : null;
    const raw = el?.textContent?.trim();
    if (raw) {
      const value = JSON.parse(raw) as SsrIsland;
      if (value && value.post && typeof value.post.slug === 'string') parsed = value;
    }
  } catch {
    parsed = null;
  }
  return parsed;
}

/** Artículo de blog pre-renderizado para este slug, o null. */
export function ssrPost(slug: string | undefined): Post | null {
  const data = read();
  if (data?.type === 'post' && slug && data.post.slug === slug) return data.post;
  return null;
}

/** Pieza de colección pre-renderizada para este tipo+slug, o null. */
export function ssrColeccion(tipo: string | undefined, slug: string | undefined): Post | null {
  const data = read();
  if (data?.type === 'coleccion' && slug && tipo && data.post.slug === slug && data.tipo === tipo) {
    return data.post;
  }
  return null;
}

/** Quita el bloque SSR visible una vez React ya ha montado el artículo real. */
export function dropSsrContent(): void {
  try {
    document.getElementById('ssr-content')?.remove();
  } catch {
    /* no-op */
  }
}
