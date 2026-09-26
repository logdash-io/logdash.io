<script lang="ts">
  import CheckIcon from '$lib/domains/shared/icons/CheckIcon.svelte';
  import DowntimeFeed from './DowntimeFeed.svelte';
  import LandingHeading from './LandingHeading.svelte';
  import LandingSection from './LandingSection.svelte';
  import StageLight from './stage/StageLight.svelte';
  import StagePanel from './stage/StagePanel.svelte';

  const ASSURANCES = [
    'Alerted within 15 seconds on Telegram or a webhook',
    'A public status page that answers before they ask',
  ];
</script>

<LandingHeading
  id="problem-statement"
  dividerTop
  title="Stuff breaks. That’s expected."
  quiet="Going quiet isn’t."
  description="Every silent minute, your users assume the worst and tell everyone. Get the alert first, and let them know before they ask."
>
  <ul
    class="mt-8 flex flex-col items-start gap-3 text-left sm:flex-row sm:items-center sm:gap-8"
  >
    {#each ASSURANCES as assurance (assurance)}
      <li class="flex items-start gap-2.5 text-sm sm:items-center">
        <CheckIcon class="text-neutral-500 mt-0.5 size-4 shrink-0 sm:mt-0" />
        <span class="text-neutral-300">{assurance}</span>
      </li>
    {/each}
  </ul>
</LandingHeading>

<LandingSection>
  <div class="relative h-[28rem] overflow-hidden sm:h-[32rem]">
    <StageLight preset="bottom" class="absolute inset-0" />

    <StagePanel
      class="inset-x-4 top-10 bottom-0 mx-auto max-w-2xl rounded-t-xl sm:top-14"
    >
      <div class="px-5 pt-5">
        <DowntimeFeed />
      </div>

      <div
        class="to-surface-elevated pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent"
      ></div>
    </StagePanel>
  </div>
</LandingSection>
