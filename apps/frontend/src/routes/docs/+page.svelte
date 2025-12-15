<script lang="ts">
  import AnimatedView from '$lib/domains/shared/ui/AnimatedView.svelte';
  import Footer from '$lib/landing/Footer.svelte';
  import DocsPage from '$lib/landing/docs/DocsPage.svelte';
  import SeoMeta from '$lib/domains/shared/ui/SeoMeta.svelte';
</script>

<SeoMeta
  title="Documentation | Logdash"
  description="Learn how to integrate Logdash with your application. Guides for logging, metrics, and monitoring setup."
  keywords="logdash documentation, logdash docs, integration guide, setup guide, api reference"
/>

<AnimatedView class="relative mx-auto flex w-full max-w-7xl flex-col">
  <DocsPage />

  <Footer />
</AnimatedView>
