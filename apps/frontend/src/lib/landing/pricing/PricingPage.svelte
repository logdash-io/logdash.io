<script lang="ts">
  import { resolve } from '$app/paths';
  import ChevronRightIcon from '$lib/domains/shared/icons/ChevronRightIcon.svelte';
  import FaqSection from '$lib/landing/FAQSection.svelte';
  import FinalCta from '$lib/landing/FinalCta.svelte';
  import Footer from '$lib/landing/Footer.svelte';
  import LandingHeading from '$lib/landing/LandingHeading.svelte';
  import LandingSection from '$lib/landing/LandingSection.svelte';
  import TestimonialsList from '$lib/landing/TestimonialsList.svelte';
  import PricingComparisonTable from './PricingComparisonTable.svelte';
  import PricingGrid from './PricingGrid.svelte';
  import PricingNote from './PricingNote.svelte';
</script>

<div class="flex w-full flex-col">
  <header
    class="mx-auto flex w-full max-w-landing flex-col items-start px-4 pt-12 pb-12 sm:px-6 lg:px-10 lg:pt-16 lg:pb-16"
  >
    <nav aria-label="Breadcrumb">
      <ol class="text-neutral-500 flex items-center gap-2 text-sm">
        <li>
          <a
            href={resolve('/')}
            class="hover:text-fg-default transition-ink duration-150"
          >
            Home
          </a>
        </li>
        <li aria-hidden="true">
          <ChevronRightIcon class="text-neutral-600 size-3.5" />
        </li>
        <li aria-current="page" class="text-neutral-300">Pricing</li>
      </ol>
    </nav>

    <h1
      class="mt-6 max-w-5xl text-[32px] leading-[1.04] font-medium tracking-[-0.03em] text-balance sm:text-[40px] lg:text-[56px]"
    >
      Start free.
      <span class="text-neutral-600 block">
        Upgrade when it pays for itself.
      </span>
    </h1>

    <p class="text-neutral-400 mt-6 max-w-2xl text-lg text-pretty sm:text-xl">
      Every plan comes with uptime monitoring, logs, metrics and status pages.
      No credit card to start.
    </p>
  </header>

  <LandingSection dividerTop>
    <PricingGrid />
  </LandingSection>

  <LandingHeading
    id="detailed-plans-comparison"
    title="Compare plans"
    description="Every limit, side by side."
  />

  <LandingSection>
    <PricingComparisonTable />
  </LandingSection>

  <TestimonialsList />

  <PricingNote />

  <FaqSection />

  <FinalCta />

  <LandingSection divider={false} class="h-12 lg:h-16" />

  <Footer />
</div>
