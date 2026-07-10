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
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Supabase — solo cuando se necesita (blog, admin)
          if (id.includes('@supabase')) return 'supabase';

          // Tiptap — SOLO en el chunk del admin, nunca en el bundle inicial
          if (
            id.includes('@tiptap') ||
            id.includes('prosemirror')
          ) return 'tiptap';

          // React ecosystem — vendor estable
          if (id.includes('react-dom') || id.includes('react-router')) return 'react-vendor';
        },
      },
    },
    // Aumentar el aviso de chunk size para no confundir warnings con errores
    chunkSizeWarningLimit: 600,
  },
});
