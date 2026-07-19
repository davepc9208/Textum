import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Formulario de contacto → Cloudflare Pages Function local
      '/api/contact': {
        target: 'http://localhost:8888',
        changeOrigin: true,
      },
      // Distribuir contenido → Cloudflare Pages Function local
      '/api/distribute': {
        target: 'http://localhost:8888',
        changeOrigin: true,
      },
      // cdn-cgi/trace: en local Cloudflare no existe, devolvemos un mock
      // que simula un usuario en España (EUR) para desarrollo.
      // En producción Cloudflare Pages responde directamente.
      '/cdn-cgi/trace': {
        target: 'http://localhost:8888',
        changeOrigin: true,
        bypass(req, res) {
          // Solo en dev: respuesta mock inmediata, sin necesidad de servidor
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
            'loc=ES\n' +   // ← Simula usuario en España → EUR
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
          // Supabase — solo cuando se necesita (blog, admin)
          if (id.includes('@supabase')) return 'supabase';

          // Tiptap + ProseMirror — SOLO en el chunk del admin
          if (id.includes('@tiptap') || id.includes('prosemirror')) return 'tiptap';

          // react-icons — iconos de redes sociales (ShareCard, ShareMenu)
          // Separado para que no entre en el bundle inicial
          if (id.includes('react-icons')) return 'ui-icons';

          // React ecosystem — vendor estable
          if (id.includes('react-dom') || id.includes('react-router')) return 'react-vendor';
        },
      },
    },
    // Aumentar el aviso de chunk size para no confundir warnings con errores
    chunkSizeWarningLimit: 600,
  },
});
