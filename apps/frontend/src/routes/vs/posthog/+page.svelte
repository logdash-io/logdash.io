<script lang="ts">
  import Footer from '$lib/landing/Footer.svelte';
  import PosthogComparison from '$lib/landing/compare/PosthogComparison.svelte';
  import SeoMeta from '$lib/domains/shared/ui/SeoMeta.svelte';
</script>

<SeoMeta
  title="Logdash vs PostHog | How SaaS founders keep their apps healthy."
  description="Detailed comparison between Logdash and PostHog. Learn when to use Logdash for app health monitoring vs PostHog for product analytics."
  keywords="logdash vs posthog, logdash alternative, posthog alternative, app monitoring vs product analytics"
/>

<div class="relative mx-auto flex w-full max-w-landing flex-col">
  <PosthogComparison />

  <Footer />
</div>
