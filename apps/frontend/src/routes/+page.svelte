<script lang="ts">
  import SeoMeta from '$lib/domains/shared/ui/SeoMeta.svelte';
  import FaqSection from '$lib/landing/FAQSection.svelte';
  import FinalCta from '$lib/landing/FinalCta.svelte';
  import FirstThirtyDays from '$lib/landing/FirstThirtyDays.svelte';
  import Footer from '$lib/landing/Footer.svelte';
  import HealthBento from '$lib/landing/HealthBento.svelte';
  import Hero from '$lib/landing/hero/Hero.svelte';
  import LandingSection from '$lib/landing/LandingSection.svelte';
  import LogdashDifference from '$lib/landing/LogdashDifference.svelte';
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

<div class="flex w-full flex-col">
  <Hero />

  <ProblemStatement />

  <HealthBento />

  <FirstThirtyDays />

  <LogdashDifference />

  <TestimonialsList />

  <FaqSection />

  <FinalCta />

  <LandingSection divider={false}>
    <Footer />
  </LandingSection>
</div>
