<script lang="ts">
	import Features from '$lib/landing/Features.svelte';
	import Footer from '$lib/landing/Footer.svelte';
	import AnimatedView from '$lib/shared/ui/AnimatedView.svelte';
</script>

<AnimatedView class="mx-auto flex w-full max-w-7xl flex-col">
	<Features />

	<Footer />
</AnimatedView>
