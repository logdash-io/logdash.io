import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter(),
		paths: {
			relative: false,
			base: process.env.NODE_ENV === 'production' ? '' : '',
		},
	},
	compilerOptions: {
		warningFilter: (warning) =>
			!warning.filename?.includes('node_modules') &&
			!warning.code.startsWith('a11y'),
	},
};

export default config;
