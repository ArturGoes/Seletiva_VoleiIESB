import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { viteSingleFile } from 'vite-plugin-singlefile';

// SINGLEFILE=1 -> gera um único index.html com tudo embutido (para hospedar/abrir em qualquer lugar).
// Caso contrário -> build normal com PWA (offline/instalável).
const singlefile = process.env.SINGLEFILE === '1';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    ...(singlefile
      ? [viteSingleFile()]
      : [
          VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
            manifest: {
              name: 'Seletiva Vôlei de Areia — IESB',
              short_name: 'Seletiva IESB',
              description: 'Check-in, avaliação e seleção da Seletiva de Vôlei de Areia do IESB. #FirmeNaAreia',
              lang: 'pt-BR',
              theme_color: '#C8102E',
              background_color: '#FFF7F3',
              display: 'standalone',
              orientation: 'portrait',
              start_url: './',
              scope: './',
              icons: [
                { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
                { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
                { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
              ]
            },
            workbox: {
              globPatterns: ['**/*.{js,css,html,svg,png,woff,woff2}'],
              navigateFallback: 'index.html',
              cleanupOutdatedCaches: true
            }
          })
        ])
  ]
});
