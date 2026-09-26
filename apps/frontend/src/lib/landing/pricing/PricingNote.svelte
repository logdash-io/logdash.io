<script lang="ts">
  import FoundersByline from '$lib/landing/FoundersByline.svelte';
  import LandingSection from '$lib/landing/LandingSection.svelte';

  const PARAGRAPHS = [
    'Our pricing is designed to let you explore all of the Logdash features and capabilities without paying a dime.',
    'We believe that the best way to help with your success is to give you access to everything we have to offer, even before you decide to upgrade.',
    'Focus on building your awesome projects; your access to all features is only limited by fair resource usage on our side.',
    "We're committed to transparency and fairness as we grow. Thanks for joining our journey!",
  ];
</script>

<LandingSection>
  <div class="grid grid-cols-1 lg:grid-cols-12">
    <div
      class="border-hairline flex flex-col px-4 py-10 sm:px-6 lg:col-span-5 lg:border-r lg:px-10 lg:py-12"
    >
      <h2 class="text-2xl font-medium tracking-[-0.02em]">A note from us</h2>

      <FoundersByline class="mt-8 lg:mt-auto" />
    </div>

    <div
      class="border-hairline flex flex-col gap-4 border-t px-4 py-10 sm:px-6 lg:col-span-7 lg:border-t-0 lg:px-10 lg:py-12"
    >
      {#each PARAGRAPHS as paragraph (paragraph)}
        <p
          class="text-neutral-400 max-w-2xl text-lg leading-relaxed text-pretty"
        >
          {paragraph}
        </p>
      {/each}
    </div>
  </div>
</LandingSection>
