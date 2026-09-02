<script lang="ts">
  import AnimatedView from '$lib/domains/shared/ui/AnimatedView.svelte';
  import SeoMeta from '$lib/domains/shared/ui/SeoMeta.svelte';
  import ResponsiveSkyBackground from '$lib/domains/shared/upgrade/ResponsiveSkyBackground.svelte';
  import FaqSection from '$lib/landing/FAQSection.svelte';
  import FinalCta from '$lib/landing/FinalCta.svelte';
  import Footer from '$lib/landing/Footer.svelte';
  import FoundersMemo from '$lib/landing/FoundersMemo.svelte';
  import FrameworksList from '$lib/landing/FrameworksList.svelte';
  import HealthBento from '$lib/landing/HealthBento.svelte';
  import Hero from '$lib/landing/hero/Hero.svelte';
  import HowItWorks from '$lib/landing/HowItWorks.svelte';
  import LogdashDifference from '$lib/landing/LogdashDifference.svelte';
  import PricingCta from '$lib/landing/pricing/PricingCta.svelte';
  import ProblemStatement from '$lib/landing/ProblemStatement.svelte';
  import TestimonialsList from '$lib/landing/TestimonialsList.svelte';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Logdash',
    url: 'https://logdash.io',
    logo: 'https://logdash.io/logo.png',
    sameAs: ['https://x.com/logdash_io'],
    description:
      'Uptime monitoring, logs and metrics for SaaS founders. No account needed.',
  };
</script>

<SeoMeta
  title="Logdash - Uptime monitoring, logs and metrics for SaaS founders"
  description="Paste your URL and watch a live dashboard in 30 seconds, no account needed. Uptime monitoring, logs and metrics for SaaS founders."
  keywords="uptime monitoring, saas monitoring, solo founder tools, log management, server monitoring, logdash"
  {jsonLd}
/>

<AnimatedView class="flex w-full flex-col px-4">
  <ResponsiveSkyBackground />

  <div class="mx-auto flex w-full max-w-7xl flex-col">
    <Hero />

    <div class="distance h-12 sm:h-20"></div>

    <FrameworksList />

    <div class="distance h-16 sm:h-32"></div>

    <ProblemStatement />

    <div class="distance h-16 sm:h-32"></div>

    <HealthBento />

    <div class="distance h-16 sm:h-32"></div>

    <HowItWorks />

    <div class="distance h-16 sm:h-32"></div>

    <LogdashDifference />

    <div class="distance h-16 sm:h-32"></div>

    <TestimonialsList />

    <div class="distance h-16 sm:h-32"></div>

    <PricingCta />

    <div class="distance h-16 sm:h-32"></div>

    <FaqSection />

    <div class="distance h-16 sm:h-32"></div>

    <FoundersMemo />

    <div class="distance h-16 sm:h-32"></div>

    <FinalCta />

    <div class="distance h-16 sm:h-32"></div>

    <Footer />

    <div class="distance h-12"></div>
  </div>
</AnimatedView>
