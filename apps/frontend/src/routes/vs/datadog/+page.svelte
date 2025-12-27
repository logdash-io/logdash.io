<script lang="ts">
  import AnimatedView from '$lib/domains/shared/ui/AnimatedView.svelte';
  import Footer from '$lib/landing/Footer.svelte';
  import DatadogComparison from '$lib/landing/compare/DatadogComparison.svelte';
  import SeoMeta from '$lib/domains/shared/ui/SeoMeta.svelte';
</script>

<SeoMeta
  title="Logdash vs Datadog | Founder-Friendly Monitoring at Startup Prices"
  description="Detailed comparison between Logdash and Datadog. Discover why early-stage founders choose affordable simplicity over enterprise complexity."
  keywords="logdash vs datadog, datadog alternative, affordable monitoring, startup observability, datadog pricing"
/>

<AnimatedView class="relative mx-auto flex w-full max-w-7xl flex-col">
  <DatadogComparison />

  <Footer />
</AnimatedView>
