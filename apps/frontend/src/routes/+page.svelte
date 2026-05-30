<script lang="ts">
  import SeoMeta from '$lib/domains/shared/ui/SeoMeta.svelte';
  import HeroDemoReveal from '$lib/landing/hero/HeroDemoReveal.svelte';
  import ProofStrip from '$lib/landing/sections/ProofStrip.svelte';
  import OneLineInstall from '$lib/landing/sections/OneLineInstall.svelte';
  import Pillars from '$lib/landing/sections/Pillars.svelte';
  import Wedge from '$lib/landing/sections/Wedge.svelte';
  import TrustProofExample from '$lib/landing/TestimonialsList.svelte';
  import PricingSection from '$lib/landing/pricing/PricingSection.svelte';
  import FoundersMemo from '$lib/landing/FoundersMemo.svelte';
  import FaqSection from '$lib/landing/FAQSection.svelte';
  import FinalCta from '$lib/landing/sections/FinalCta.svelte';
  import Footer from '$lib/landing/Footer.svelte';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Logdash',
    url: 'https://logdash.io',
    logo: 'https://logdash.io/logo.png',
    sameAs: ['https://x.com/logdash_io'],
    description: 'SaaS health monitoring for solo founders.',
  };
</script>

<SeoMeta
  title="Logdash - SaaS Health Monitoring for Solo Founders"
  description="Logs, metrics, and uptime monitoring in one dashboard. One line of SDK, live in 60 seconds — no agents, no infra, no enterprise bill."
  keywords="saas monitoring, solo founder tools, log management, server monitoring, uptime monitoring, logdash"
  {jsonLd}
/>

<HeroDemoReveal />

<div class="flex w-full shrink-0 flex-col">
  <ProofStrip />
  <OneLineInstall />
  <Pillars />
  <Wedge />
  <TrustProofExample />
  <PricingSection />
  <FoundersMemo />
  <FaqSection />
  <FinalCta />
  <Footer />
</div>
