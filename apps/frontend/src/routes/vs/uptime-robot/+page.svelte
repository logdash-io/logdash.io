<script lang="ts">
  import AnimatedView from '$lib/domains/shared/ui/AnimatedView.svelte';
  import Footer from '$lib/landing/Footer.svelte';
  import UptimeRobotComparison from '$lib/landing/compare/UptimeRobotComparison.svelte';
  import SeoMeta from '$lib/domains/shared/ui/SeoMeta.svelte';
</script>

<SeoMeta
  title="Logdash vs Uptime Robot | Full-Stack Monitoring Beyond Uptime Checks"
  description="Detailed comparison between Logdash and Uptime Robot. See why modern founders choose full observability over basic uptime monitoring."
  keywords="logdash vs uptime robot, uptime robot alternative, uptime monitoring, saas monitoring, server logs"
/>

<AnimatedView class="relative mx-auto flex w-full max-w-7xl flex-col">
  <UptimeRobotComparison />

  <Footer />
</AnimatedView>
