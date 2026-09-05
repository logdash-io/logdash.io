<script lang="ts">
  import Footer from '$lib/landing/Footer.svelte';
  import UptimeRobotComparison from '$lib/landing/compare/UptimeRobotComparison.svelte';
  import SeoMeta from '$lib/domains/shared/ui/SeoMeta.svelte';
</script>

<SeoMeta
  title="Logdash vs Uptime Robot | Full-Stack Monitoring Beyond Uptime Checks"
  description="Detailed comparison between Logdash and Uptime Robot. See why modern founders choose full observability over basic uptime monitoring."
  keywords="logdash vs uptime robot, uptime robot alternative, uptime monitoring, saas monitoring, server logs"
/>

<div class="relative mx-auto flex w-full max-w-landing flex-col">
  <UptimeRobotComparison />

  <Footer />
</div>
