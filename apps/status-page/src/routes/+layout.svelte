<script lang="ts">
	import '@fontsource-variable/inter/opsz.css';
	import '@fontsource-variable/geist-mono';
	import '../app.css';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

{@render children()}
