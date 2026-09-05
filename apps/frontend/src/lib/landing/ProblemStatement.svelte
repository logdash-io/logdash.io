<script lang="ts">
  import CheckIcon from '$lib/domains/shared/icons/CheckIcon.svelte';
  import DowntimeFeed from './DowntimeFeed.svelte';
  import LandingSection from './LandingSection.svelte';

  const ASSURANCES = [
    'Alerted within 15 seconds on Telegram or a webhook.',
    'A public status page that answers before they have to ask.',
  ];
</script>

<LandingSection id="problem-statement" dividerTop>
  <div
    class="grid grid-cols-1 gap-10 px-4 py-16 sm:px-6 md:grid-cols-5 md:gap-12 lg:px-10 lg:py-20"
  >
    <div class="flex flex-col gap-10 md:col-span-2">
      <div class="flex flex-col gap-4">
        <h2
          class="text-3xl font-medium tracking-[-0.03em] text-balance sm:text-4xl"
        >
          Stuff breaks. That’s expected.
          <span class="text-neutral-600 block">Going quiet isn’t.</span>
        </h2>

        <p class="text-neutral-400 text-lg text-pretty">
          Brand is everything, and downtime is a direct attack on it. Every
          silent minute, your users assume the worst and tell everyone. Get the
          alert first, and let them know before they ask.
        </p>
      </div>

      <ul class="mt-auto flex flex-col gap-3">
        {#each ASSURANCES as assurance (assurance)}
          <li class="flex items-start gap-3">
            <CheckIcon class="text-success mt-0.5 size-5 shrink-0" />

            <span class="text-neutral-400 text-sm leading-relaxed">
              {assurance}
            </span>
          </li>
        {/each}
      </ul>
    </div>

    <!-- The feed sits straight on the page. Its row hairlines are all the structure it needs. -->
    <div class="md:col-span-3">
      <DowntimeFeed />
    </div>
  </div>
</LandingSection>
