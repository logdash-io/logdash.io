import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import postcssOKLabFunction from '@csstools/postcss-oklab-function';

export default defineConfig({
  plugins: [
    sveltekit(),
    {
      name: 'full-reload',
      handleHotUpdate({ server }) {
        // return;
        server.ws.send({
          type: 'full-reload',
          path: '*',
        });
      },
    },
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
    // postcss: {
    //   plugins: [postcssOKLabFunction],
    // },
  },
  build: {
    target: ['es2015', 'ios11'],
  },
});
