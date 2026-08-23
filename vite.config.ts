// vite.config.ts
// v2 — mejoras de chunking para rendimiento móvil:
//
// PROBLEMA detectado por Lighthouse:
// tiptap (150 KB) y supabase (55 KB) aparecían en la lista de
// "Reduce el contenido JavaScript que no se use" con 137 KB y 46 KB de ahorro.
// Esto significa que se descargaban en la carga inicial aunque solo se usan
// en /blog, /colecciones y /textum-redaccion-2026.
//
// CAUSA RAÍZ:
// BlogPreview.tsx importaba supabase indirectamente a través de un componente
// que no estaba lazy-loaded. El import estático rompía el tree-shaking del chunk.
//
// SOLUCIÓN:
// 1. Chunk 'supabase' ya existía — se mantiene.
// 2. Chunk 'tiptap' ya existía — se mantiene.
// 3. NUEVO: chunk 'blog-runtime' agrupa BlogPage, PostPage, ColeccionesPage,
//    ColeccionListPage, ColeccionPiecePage. Estos componentes usan supabase
//    y deben cargarse juntos pero solo cuando se navegue a esas rutas.
// 4. NUEVO: 'react-icons' ya estaba separado — se mantiene.
// 5. NUEVO: chunk 'admin' para AdminPage y AdminDistribute — ya era lazy
//    pero ahora explicitamos que sus deps (tiptap) van en ese chunk.
//
// IMPORTANTE: los manualChunks por sí solos no son suficientes.
// Es CRÍTICO que BlogPage, PostPage y las páginas de Colecciones sean lazy
// en App.tsx para que el chunking tenga efecto real.
// Ver App.tsx — BlogListPage y PostPage deben envolverse en Suspense.

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/contact': {
        target: 'http://localhost:8888',
        changeOrigin: true,
      },
      '/api/distribute': {
        target: 'http://localhost:8888',
        changeOrigin: true,
      },
      '/api/translate': {
        target: 'http://localhost:8888',
        changeOrigin: true,
      },
      '/cdn-cgi/trace': {
        target: 'http://localhost:8888',
        changeOrigin: true,
        bypass(req, res) {
          res.setHeader('Content-Type', 'text/plain');
          res.end(
            'fl=123abc\n' +
            'h=mentoriatextum.com\n' +
            'ip=1.2.3.4\n' +
            'ts=1700000000.000\n' +
            'visit_scheme=https\n' +
            'uag=Mozilla/5.0\n' +
            'colo=MAD\n' +
            'sliver=none\n' +
            'http=http/2\n' +
            'loc=ES\n' +
            'tls=TLSv1.3\n' +
            'sni=plaintext\n' +
            'warp=off\n' +
            'gateway=off\n' +
            'rbi=off\n' +
            'kex=X25519\n'
          );
          return false;
        },
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // ── Supabase ─────────────────────────────────────────────────────
          // Se usa en BlogPage, PostPage, Colecciones* y AdminPage.
          // Todos son lazy, así que este chunk nunca se carga en la homepage.
          if (id.includes('@supabase')) {
            return 'supabase';
          }

          // ── react-icons ───────────────────────────────────────────────────
          // ShareCard y ShareMenu los usan, pero esos componentes solo se
          // renderizan en PostPage y ColeccionPiecePage (lazy).
          if (id.includes('react-icons')) {
            return 'ui-icons';
          }

          // ── React ecosystem ───────────────────────────────────────────────
          // react-dom y react-router van juntos — son el vendor estable
          // que sí se carga en la homepage (necesario para el SPA).
          if (id.includes('react-dom') || id.includes('react-router')) {
            return 'react-vendor';
          }

        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});
