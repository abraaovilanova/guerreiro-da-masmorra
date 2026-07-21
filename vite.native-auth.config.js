import { defineConfig } from 'vite';

/* Build isolado só do bundle de login nativo (Google/Android). Não tem relação
   nenhuma com o resto do jogo — index.html/www/index.html continuam sem bundler. */
export default defineConfig({
  build: {
    outDir: 'www/js',
    emptyOutDir: false,
    lib: {
      entry: 'native-auth/main.js',
      formats: ['iife'],
      name: 'NativeGoogleAuthBundle',
      fileName: () => 'native-auth.bundle.js',
    },
  },
});
