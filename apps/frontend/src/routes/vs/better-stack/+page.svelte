<script lang="ts">
  import Footer from '$lib/landing/Footer.svelte';
  import BetterStackComparison from '$lib/landing/compare/BetterStackComparison.svelte';
  import SeoMeta from '$lib/domains/shared/ui/SeoMeta.svelte';
</script>

<SeoMeta
  title="Logdash vs Better Stack | Unified Platform vs. Product Suite"
  description="Detailed comparison between Logdash and Better Stack. Compare unified monitoring experience vs. multiple separate products."
  keywords="logdash vs better stack, better stack alternative, better uptime alternative, logtail alternative, unified monitoring"
/>

<div class="relative mx-auto flex w-full max-w-landing flex-col">
  <BetterStackComparison />

  <Footer />
</div>
