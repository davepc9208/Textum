// vite.config.ts
//
// Estrategia de chunking (rendimiento móvil):
// - supabase        → solo lo cargan páginas lazy (blog, colecciones, admin); nunca en la home.
// - ui-icons        → react-icons, usado solo en PostPage / ColeccionPiecePage (lazy).
// - react-vendor    → react-dom + react-router, vendor estable que sí entra en la home.
// - editor          → tiptap + lowlight + highlight.js, pesado y exclusivo del panel admin (lazy).
//
// Los manualChunks NO bastan por sí solos: BlogPage, PostPage, Colecciones* y
// AdminPage deben ser lazy en App.tsx para que el chunking tenga efecto real.

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
      '/api/assistant': {
        target: 'http://localhost:8888',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('@supabase')) {
            return 'supabase';
          }

          if (id.includes('react-icons')) {
            return 'ui-icons';
          }

          // Editor de artículos: solo se usa en el panel admin (lazy).
          if (
            id.includes('@tiptap')
            || id.includes('prosemirror')
            || id.includes('lowlight')
            || id.includes('highlight.js')
          ) {
            return 'editor';
          }

          if (id.includes('react-dom') || id.includes('react-router')) {
            return 'react-vendor';
          }
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});
