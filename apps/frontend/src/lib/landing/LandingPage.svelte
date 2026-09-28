<script lang="ts">
  import FaqSection from '$lib/landing/FAQSection.svelte';
  import FinalCta from '$lib/landing/FinalCta.svelte';
  import Footer from '$lib/landing/Footer.svelte';
  import Features from '$lib/landing/Features.svelte';
  import FundedByUsers from '$lib/landing/FundedByUsers.svelte';
  import Hero from '$lib/landing/hero/Hero.svelte';
  import LandingSection from '$lib/landing/LandingSection.svelte';
  import ProblemStatement from '$lib/landing/ProblemStatement.svelte';
  import TestimonialsList from '$lib/landing/TestimonialsList.svelte';
</script>

<div class="flex w-full flex-col">
  <Hero />

  <ProblemStatement />

  <Features />

  <TestimonialsList />

  <FundedByUsers />

  <FaqSection />

  <FinalCta />

  <LandingSection divider={false} class="h-12 lg:h-16" />

  <Footer />
</div>
