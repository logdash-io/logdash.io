<script lang="ts">
	import AnimatedView from '$lib/shared/ui/AnimatedView.svelte';
	import Footer from '$lib/landing/Footer.svelte';
	import DocsPage from '$lib/landing/docs/DocsPage.svelte';
</script>

<AnimatedView class="relative mx-auto flex w-full max-w-7xl flex-col">
	<DocsPage />

	<Footer />
</AnimatedView>
