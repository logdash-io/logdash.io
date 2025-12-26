<script lang="ts">
  import AnimatedView from '$lib/domains/shared/ui/AnimatedView.svelte';
  import DocumentationContent from '$lib/landing/guides/DocumentationContent.svelte';
  import SeoMeta from '$lib/domains/shared/ui/SeoMeta.svelte';
  import Footer from '$lib/landing/Footer.svelte';
</script>

<SeoMeta
  title="Metrics | Logdash Guides"
  description="Track custom metrics from your application to monitor key business indicators with Logdash."
  keywords="logdash metrics, custom metrics, business metrics, metrics tracking"
/>

<AnimatedView class="mx-auto w-full">
  <div class="mx-auto max-w-3xl">
    <DocumentationContent />
  </div>
  <Footer />
</AnimatedView>
