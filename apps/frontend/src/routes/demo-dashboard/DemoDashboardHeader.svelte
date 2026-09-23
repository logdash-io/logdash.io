<script lang="ts">
  import FoundersCard from '$lib/landing/FoundersCard.svelte';
  import LandingSection from '$lib/landing/LandingSection.svelte';
</script>

<LandingSection>
  <header
    class="flex flex-col items-start px-4 pt-12 pb-12 sm:px-6 lg:px-10 lg:pt-16"
  >
    <span class="text-neutral-500 text-sm">Live demo</span>

    <h1
      class="mt-3 text-4xl leading-[1.08] font-medium tracking-[-0.03em] text-balance sm:text-5xl"
    >
      Our production dashboard.
    </h1>

    <p class="text-neutral-400 mt-4 max-w-2xl text-lg text-pretty">
      Real logs, metrics and uptime from Logdash itself, with anything sensitive
      removed. Filter the logs, open a metric, look around.
    </p>

    <FoundersCard variant="flat" class="mt-8" />
  </header>
</LandingSection>
