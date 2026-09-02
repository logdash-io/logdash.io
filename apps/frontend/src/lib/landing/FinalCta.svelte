<script lang="ts">
  import FlamingoIcon from '$lib/domains/shared/icons/FlamingoIcon.svelte';
  import HeroUrlForm from '$lib/landing/hero/HeroUrlForm.svelte';
</script>

<section class="w-full">
  <div
    class="ld-card relative mx-auto w-full max-w-5xl overflow-hidden py-14 sm:py-20"
  >
    <div class="flex w-full flex-col gap-4 sm:max-w-lg">
      <h2
        class="text-center text-3xl font-extrabold tracking-tighter sm:text-left sm:text-4xl lg:text-5xl"
      >
        Know before they do.
      </h2>

      <FlamingoIcon class="text-primary mx-auto h-44 w-44 md:hidden" />

      <p
        class="text-base-content/70 text-center text-base leading-relaxed sm:text-left"
      >
        Paste your URL and we start watching it right now.
      </p>

      <HeroUrlForm compact={true} source="final-cta" />

      <p class="text-base-content/45 text-center text-sm sm:text-left">
        No signup · No credit card · Claim later with GitHub or Google
      </p>
    </div>

    <FlamingoIcon
      class="text-primary pointer-events-none absolute right-8 bottom-6 hidden h-48 w-48 md:block"
    />
  </div>
</section>
