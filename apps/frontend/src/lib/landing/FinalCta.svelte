<script lang="ts">
  import HeroUrlForm from '$lib/landing/hero/HeroUrlForm.svelte';
  import LandingSection from './LandingSection.svelte';
</script>

<LandingSection id="final-cta">
  <div
    class="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 px-4 py-20 text-center sm:px-6 lg:px-10 lg:py-24"
  >
    <div class="flex flex-col gap-3">
      <h2 class="text-3xl font-medium tracking-[-0.03em] sm:text-4xl">
        Know before they do.
      </h2>

      <p class="text-neutral-400 text-lg">
        Paste your URL and we start watching it right now.
      </p>
    </div>

    <div class="w-full max-w-xl">
      <HeroUrlForm compact={true} source="final-cta" />
    </div>

    <p class="text-neutral-600 text-sm">
      No signup · No credit card · Claim later with GitHub or Google
    </p>
  </div>
</LandingSection>
