<script lang="ts">
  import FlamingoIcon from '$lib/domains/shared/icons/FlamingoIcon.svelte';
  import AnimatedView from '$lib/domains/shared/ui/AnimatedView.svelte';
  import ResponsiveSkyBackground from '$lib/domains/shared/upgrade/ResponsiveSkyBackground.svelte';
  import FaqSection from '$lib/landing/FAQSection.svelte';
  import Logs from '$lib/landing/FakeLogs.svelte';
  import Features from '$lib/landing/Features.svelte';
  import Footer from '$lib/landing/Footer.svelte';
  import FoundersMemo from '$lib/landing/FoundersMemo.svelte';
  import HeroSectionCTA from '$lib/landing/HeroSectionCTA.svelte';
  import HowItWorks from '$lib/landing/HowItWorks.svelte';
  import LogdashDifference from '$lib/landing/LogdashDifference.svelte';
  import ProblemStatement from '$lib/landing/ProblemStatement.svelte';
  import SystemHealth from '$lib/landing/SystemHealth.svelte';
  import TrustProofExample from '$lib/landing/TestimonialsList.svelte';
  import WhyLogdash from '$lib/landing/WhyLogdash.svelte';
  import PricingSection from '$lib/landing/pricing/PricingSection.svelte';
  import PricingTrustProof from '$lib/landing/pricing/PricingTrustProof.svelte';
  import { ArrowRightIcon } from 'lucide-svelte';
</script>

<svelte:head>
  <title>logdash</title>
  <meta
    name="description"
    content="App health monitoring platform with all you need to stop critical issues from getting in your way."
  />
</svelte:head>

<AnimatedView class="mx-auto flex w-full max-w-7xl flex-col">
  <ResponsiveSkyBackground />

  <header class="hero md:pb-4 md:pt-14 sm:px-8">
    <div
      class="hero-content w-full flex-col lg:flex-row lg:justify-around lg:gap-10"
    >
      <div
        class="flex w-full flex-col items-center justify-center gap-6 text-center lg:items-start lg:gap-10 lg:text-left"
      >
        <h1
          class="flex flex-col items-center gap-3 text-4xl font-extrabold tracking-tight md:-mb-4 lg:items-start lg:text-6xl"
        >
          How solo founders keep their SaaS apps healthy.
        </h1>

        <p class="w-11/12 text-lg leading-relaxed opacity-80">
          App health monitoring platform with all you need to stop critical
          issues from getting in your way.
        </p>

        <HeroSectionCTA />
      </div>

      <div
        class="align-start relative flex h-[500px] w-full shrink-0 justify-center overflow-hidden lg:h-96 lg:w-1/2 lg:overflow-visible"
      >
        <div
          class="rotate-z-3 sm:-rotate-z-3 absolute bottom-0 right-0 z-10 scale-90 sm:left-0 sm:right-auto lg:z-0 lg:scale-100"
        >
          <SystemHealth />
        </div>

        <div
          class="scale-80 -rotate-z-3 sm:rotate-z-3 absolute bottom-[120px] right-0 max-w-md lg:-bottom-4 lg:scale-100"
        >
          <Logs />
        </div>
      </div>
    </div>
  </header>

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
