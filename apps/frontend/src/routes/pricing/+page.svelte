<script lang="ts">
  import Footer from '$lib/landing/Footer.svelte';
  import PricingPage from '$lib/landing/pricing/PricingPage.svelte';
  import AnimatedView from '$lib/domains/shared/ui/AnimatedView.svelte';
  import ResponsiveSkyBackground from '$lib/domains/shared/upgrade/ResponsiveSkyBackground.svelte';
  import SeoMeta from '$lib/domains/shared/ui/SeoMeta.svelte';
</script>

<SeoMeta
  title="Pricing | Logdash"
  description="Simple, transparent pricing. Start for free, upgrade as you grow. No hidden fees or complex usage tiers."
  keywords="logdash pricing, free tier log management, affordable server monitoring, saas monitoring pricing"
/>

<AnimatedView class="relative mx-auto flex w-full max-w-7xl flex-col">
  <ResponsiveSkyBackground />
  <PricingPage />

  <div class="distance h-16 sm:h-32"></div>

  <Footer />
</AnimatedView>
