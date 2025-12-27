<script lang="ts">
  import AnimatedView from '$lib/domains/shared/ui/AnimatedView.svelte';
  import Footer from '$lib/landing/Footer.svelte';
  import UptimeKumaComparison from '$lib/landing/compare/UptimeKumaComparison.svelte';
  import SeoMeta from '$lib/domains/shared/ui/SeoMeta.svelte';
</script>

<SeoMeta
  title="Logdash vs Uptime Kuma | Zero-Ops Monitoring for SaaS Founders"
  description="Detailed comparison between Logdash and Uptime Kuma. Learn why founders choose managed monitoring over self-hosted solutions."
  keywords="logdash vs uptime kuma, uptime kuma alternative, self-hosted monitoring, managed monitoring, saas monitoring"
/>

<AnimatedView class="relative mx-auto flex w-full max-w-7xl flex-col">
  <UptimeKumaComparison />

  <Footer />
</AnimatedView>
