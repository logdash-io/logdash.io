<script lang="ts">
  import AnimatedView from '$lib/domains/shared/ui/AnimatedView.svelte';
  import Footer from '$lib/landing/Footer.svelte';
  import GrafanaComparison from '$lib/landing/compare/GrafanaComparison.svelte';
  import SeoMeta from '$lib/domains/shared/ui/SeoMeta.svelte';
</script>

<SeoMeta
  title="Logdash vs Grafana | Zero-Config Monitoring for SaaS Founders"
  description="Detailed comparison between Logdash and Grafana. See why founders choose pre-built monitoring over DIY dashboards and configurations."
  keywords="logdash vs grafana, grafana alternative, prometheus alternative, zero config monitoring, managed observability"
/>

<AnimatedView class="relative mx-auto flex w-full max-w-7xl flex-col">
  <GrafanaComparison />

  <Footer />
</AnimatedView>
