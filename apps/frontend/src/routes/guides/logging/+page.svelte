<script lang="ts">
  import AnimatedView from '$lib/domains/shared/ui/AnimatedView.svelte';
  import DocumentationContent from '$lib/landing/guides/DocumentationContent.svelte';
  import SeoMeta from '$lib/domains/shared/ui/SeoMeta.svelte';
  import Footer from '$lib/landing/Footer.svelte';
</script>

<SeoMeta
  title="Logging | Logdash Guides"
  description="Learn how to track system events and errors in real-time with Logdash logging. Understand retention policies and rate limits."
  keywords="logdash logging, log retention, rate limits, real-time logging"
/>

<AnimatedView class="mx-auto w-full">
  <div class="max-w-3xl mx-auto">
    <DocumentationContent />
  </div>
  <Footer />
</AnimatedView>
