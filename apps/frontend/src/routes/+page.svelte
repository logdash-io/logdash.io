<script lang="ts">
  import FlamingoIcon from '$lib/domains/shared/icons/FlamingoIcon.svelte';
  import AnimatedView from '$lib/domains/shared/ui/AnimatedView.svelte';
  import FaqSection from '$lib/landing/FAQSection.svelte';
  import Features from '$lib/landing/Features.svelte';
  import Footer from '$lib/landing/Footer.svelte';
  import FoundersMemo from '$lib/landing/FoundersMemo.svelte';
  import HowItWorks from '$lib/landing/HowItWorks.svelte';
  import LogdashDifference from '$lib/landing/LogdashDifference.svelte';
  import ProblemStatement from '$lib/landing/ProblemStatement.svelte';
  import TrustProofExample from '$lib/landing/TestimonialsList.svelte';
  import HeroDemoReveal from '$lib/landing/hero/HeroDemoReveal.svelte';
  import WhyLogdash from '$lib/landing/WhyLogdash.svelte';
  import PricingSection from '$lib/landing/pricing/PricingSection.svelte';
  import PricingTrustProof from '$lib/landing/pricing/PricingTrustProof.svelte';
  import { ArrowRightIcon } from 'lucide-svelte';
  import SeoMeta from '$lib/domains/shared/ui/SeoMeta.svelte';

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
  description="App health monitoring platform with all you need to stop critical issues from getting in your way. Logs, metrics, and uptime monitoring in one place."
  keywords="saas monitoring, solo founder tools, log management, server monitoring, uptime monitoring, logdash"
  {jsonLd}
/>

<HeroDemoReveal />

<AnimatedView class="mx-auto flex w-full max-w-7xl flex-col">
  <div class="distance h-8"></div>

  <ProblemStatement />

  <div class="distance h-16 sm:h-32"></div>

  <LogdashDifference />

  <div class="distance h-8 sm:h-12"></div>

  <PricingTrustProof />

  <div class="distance h-16 sm:h-32"></div>

  <HowItWorks />

  <div class="distance h-16 sm:h-32"></div>

  <Features />

  <div class="distance h-16 sm:h-32"></div>

  <WhyLogdash />

  <div class="distance h-16 sm:h-32"></div>

  <TrustProofExample />

  <div class="distance h-16 sm:h-32"></div>

  <PricingSection />

  <div class="distance h-16 sm:h-32"></div>

  <FaqSection />

  <div class="distance h-16 sm:h-32"></div>

  <FoundersMemo />

  <div class="distance h-16 sm:h-32"></div>

  <div class="px-2">
    <div
      class="ld-card sm:min-w-4xl max-w-5xl mx-auto text-primary-content relative flex flex-col-reverse items-center justify-between py-24 text-left sm:flex-row md:mt-14"
    >
      <div>
        <h2
          class="mb-2 text-center text-3xl font-bold sm:text-left sm:text-4xl"
        >
          Let's get you vision back.
        </h2>

        <FlamingoIcon class="text-primary h-54 w-54 mx-auto mb-6 md:hidden" />

        <p class="mb-4 w-full text-base opacity-80 md:w-1/2 lg:w-4/5 xl:w-full">
          Create your free account and get clarity in minutes.
          <br />
          Credit card is not required.
        </p>
        <a
          href="/app/auth"
          class="btn btn-primary w-full sm:w-fit"
          data-posthog-id="landing-final-section-cta"
        >
          Get started
          <ArrowRightIcon class="ml-1 size-4" />
        </a>
      </div>

      <FlamingoIcon
        class="text-primary absolute bottom-8 right-8 hidden h-64 w-64 md:block"
      />
    </div>
  </div>

  <div class="distance h-16 sm:h-32"></div>

  <Footer />

  <div class="distance h-12"></div>
</AnimatedView>
