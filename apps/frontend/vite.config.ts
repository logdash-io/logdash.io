import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import transformLucideImports from 'vite-plugin-transform-lucide-imports';

export default defineConfig({
  plugins: [
    sveltekit(),
    {
      name: 'full-reload',
      handleHotUpdate({ server }) {
        return;
        server.ws.send({
          type: 'full-reload',
          path: '*',
        });
      },
    },
    transformLucideImports(),
  ],
  /*
    transformLucideImports rewrites icon imports to deep paths after the dep
    scan, and sveltekit-sse is only imported by app routes. Left to runtime
    discovery, the first visit to a page with a new icon re-optimizes and
    reloads it mid-session, which also breaks e2e runs on a fresh server.
  */
  optimizeDeps: {
    exclude: ['lucide-svelte'],
    include: ['sveltekit-sse'],
  },
  server: {
    hmr: {
      overlay: false,
    },
  },
  css: {
    devSourcemap: false,
  },
  build: {
    target: ['es2015', 'ios11'],
  },
});
