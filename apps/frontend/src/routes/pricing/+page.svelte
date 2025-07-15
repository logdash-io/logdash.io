<script>
  import Footer from '$lib/landing/Footer.svelte';
  import PricingPage from '$lib/landing/pricing/PricingPage.svelte';
  import AnimatedView from '$lib/domains/shared/ui/AnimatedView.svelte';
  import ResponsiveSkyBackground from '$lib/domains/shared/upgrade/ResponsiveSkyBackground.svelte';
</script>

<AnimatedView class="relative mx-auto flex w-full max-w-7xl flex-col">
  <ResponsiveSkyBackground />
  <PricingPage />

  <div class="distance h-16 sm:h-32"></div>

  <Footer />
</AnimatedView>
