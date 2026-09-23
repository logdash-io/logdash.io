<script lang="ts">
  import { resolve } from '$app/paths';
  import LogoMark from '$lib/domains/shared/icons/LogoMark.svelte';
  import HeroUrlForm from '$lib/landing/hero/HeroUrlForm.svelte';
  import { ArrowRightIcon } from 'lucide-svelte';
  import LandingSection from './LandingSection.svelte';
  import StageLight from './stage/StageLight.svelte';
  import StagePanel from './stage/StagePanel.svelte';

  type Props = {
    showDemoLink?: boolean;
  };

  type Milestone = {
    day: number;
    title: string;
    description: string;
  };

  const { showDemoLink = true }: Props = $props();

  const MILESTONES: Milestone[] = [
    {
      day: 1,
      title: 'The alert beats the tweet',
      description:
        'Checks start 30 seconds after you paste a URL. When it goes down, you hear it first.',
    },
    {
      day: 7,
      title: 'The refresh reflex is gone',
      description:
        'Logs and metrics sit next to your uptime, so you stop checking by hand.',
    },
    {
      day: 30,
      title: 'Users hear it from you first',
      description:
        'A status page on your domain answers before they ask. You ship, Logdash watches.',
    },
  ];
</script>

<LandingSection id="final-cta">
  <div class="grid grid-cols-1 lg:grid-cols-2">
    <div
      class="border-hairline flex flex-col items-start px-4 py-16 sm:px-6 lg:border-r lg:px-10 lg:py-20"
    >
      <h2 class="text-4xl font-medium tracking-[-0.03em] text-balance">
        Know before they do.
      </h2>

      <p class="text-neutral-400 mt-4 max-w-md text-lg text-pretty">
        Paste your URL and we start watching it right now.
      </p>

      <div class="mt-8 w-full max-w-xl">
        <HeroUrlForm compact={true} source="final-cta" />
      </div>

      <p class="text-neutral-600 mt-4 text-sm">
        No signup · No credit card · Claim later with GitHub or Google
      </p>

      {#if showDemoLink}
        <a
          href={resolve('/demo-dashboard')}
          class="text-base-content hover:text-neutral-400 focus-visible:outline-neutral-500 mt-10 inline-flex items-center gap-1.5 rounded-full text-sm font-medium transition-ink duration-150 focus-visible:outline-2 focus-visible:outline-offset-4 lg:mt-auto"
          data-posthog-id="final-cta-demo-cta"
        >
          Or look around the live demo
          <ArrowRightIcon class="size-4" />
        </a>
      {/if}
    </div>

    <div
      class="border-hairline relative h-[27rem] overflow-hidden border-t lg:h-auto lg:min-h-[30rem] lg:border-t-0"
    >
      <StageLight preset="top-left" class="absolute inset-0" />

      <StagePanel
        class="top-10 right-0 bottom-0 left-6 rounded-tl-xl sm:left-10 lg:top-12 lg:left-12"
      >
        <div class="border-hairline flex items-center gap-3 border-b px-6 py-5">
          <LogoMark class="size-7" />
          <span class="text-lg font-medium tracking-[-0.01em]">
            Your first 30 days
          </span>
        </div>

        <ol class="flex flex-col gap-6 px-6 py-6">
          {#each MILESTONES as milestone (milestone.day)}
            <li class="flex gap-4">
              <span
                class="bg-base-100 text-neutral-300 flex h-6 w-14 shrink-0 items-center justify-center rounded-md font-mono text-xs tabular-nums"
              >
                Day {milestone.day}
              </span>

              <div class="flex flex-col gap-1">
                <span class="text-sm font-medium">{milestone.title}</span>
                <span class="text-neutral-400 text-sm leading-relaxed">
                  {milestone.description}
                </span>
              </div>
            </li>
          {/each}
        </ol>
      </StagePanel>
    </div>
  </div>
</LandingSection>
