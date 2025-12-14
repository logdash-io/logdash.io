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
  server: {
    hmr: {
      overlay: false,
    },
  },
  css: {
    devSourcemap: false,
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
      },
    },
  },
  build: {
    target: ['es2015', 'ios11'],
  },
});
