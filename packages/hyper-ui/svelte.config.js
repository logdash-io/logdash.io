import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  compilerOptions: {
    warningFilter: (warning) =>
      !warning.filename?.includes("node_modules") &&
      !warning.code.startsWith("a11y"),
  },
};

export default config;
