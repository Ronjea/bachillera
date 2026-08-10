import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

// Multi-page app: landing page, interactive map and planning-documents archive.
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        home: fileURLToPath(new URL('./index.html', import.meta.url)),
        map: fileURLToPath(new URL('./mapa.html', import.meta.url)),
        documents: fileURLToPath(new URL('./documentos.html', import.meta.url)),
      },
    },
  },
});
