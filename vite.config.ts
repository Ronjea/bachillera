import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

// Multi-page app: landing page, interactive map, planning-documents archive
// and the neighbourhood's visual memory (photos, films and press).
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        home: fileURLToPath(new URL('./index.html', import.meta.url)),
        map: fileURLToPath(new URL('./mapa.html', import.meta.url)),
        documents: fileURLToPath(new URL('./documentos.html', import.meta.url)),
        memory: fileURLToPath(new URL('./memoria.html', import.meta.url)),
      },
    },
  },
});
