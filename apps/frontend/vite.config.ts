import { sveltekit } from '@sveltejs/kit/vite';
import { readFile } from 'node:fs/promises';
import { defineConfig, transformWithEsbuild } from 'vite';
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
    { ...transformLucideImports(), apply: 'serve' },
    {
      // `import source from './file.js?minify'` inlines the file as a minified string.
      name: 'minify-import',
      enforce: 'pre',
      async load(id) {
        const [file, query] = id.split('?');
        if (query !== 'minify') return;
        const { code } = await transformWithEsbuild(
          await readFile(file, 'utf8'),
          file,
          { minify: true, target: 'es2019' },
        );
        return `export default ${JSON.stringify(code.trim())};`;
      },
    },
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
    sourcemap: true,
  },
});
