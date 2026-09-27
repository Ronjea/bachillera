import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

// Multi-page app: landing page, open-campaigns tool, interactive map,
// planning-documents archive and the neighbourhood's visual memory
// (photos, films and press).
export default defineConfig({
  // GitHub Pages serves the site under /bachillera/; CI sets BASE_PATH.
  base: process.env.BASE_PATH ?? '/',
  build: {
    rollupOptions: {
      input: {
        home: fileURLToPath(new URL('./index.html', import.meta.url)),
        movements: fileURLToPath(new URL('./movimientos.html', import.meta.url)),
        map: fileURLToPath(new URL('./mapa.html', import.meta.url)),
        documents: fileURLToPath(new URL('./documentos.html', import.meta.url)),
        periGuide: fileURLToPath(new URL('./guia-peri.html', import.meta.url)),
        memory: fileURLToPath(new URL('./memoria.html', import.meta.url)),
      },
    },
  },
});
