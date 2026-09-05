<script lang="ts">
  import { resolve } from '$app/paths';
  import { ArrowRightIcon } from 'lucide-svelte';
  import LandingSection from './LandingSection.svelte';

  type Milestone = {
    day: string;
    title: string;
    description: string;
  };

  const MILESTONES: Milestone[] = [
    {
      day: 'Day 1',
      title: 'The alert beats the tweet.',
      description:
        'Checks start 30 seconds after you paste a URL. When it goes down, Telegram pings you before anyone posts about it.',
    },
    {
      day: 'Day 7',
      title: 'The refresh reflex is gone.',
      description:
        'Logs and metrics came in with one prompt. Everything sits in one dashboard, so you stop checking by hand.',
    },
    {
      day: 'Day 30',
      title: 'Users hear it from you first.',
      description:
        'A status page on your domain answers before they ask. You ship, Logdash watches.',
    },
  ];
</script>

<LandingSection id="first-thirty-days">
  <div
    class="flex flex-col gap-12 px-4 py-16 sm:px-6 lg:gap-16 lg:px-10 lg:py-20"
  >
    <div class="text-center">
      <h2 class="text-3xl font-medium tracking-[-0.03em] sm:text-4xl">
        The first 30 days.
      </h2>

      <p class="text-neutral-400 mt-3 text-lg">
        What changes once Logdash is watching your app.
      </p>
    </div>

    <!-- Three milestones split by hairlines. -->
    <div
      class="divide-hairline grid grid-cols-1 divide-y md:grid-cols-3 md:divide-x md:divide-y-0"
    >
      {#each MILESTONES as milestone (milestone.day)}
        <div
          class="flex flex-col gap-3 py-8 first:pt-0 last:pb-0 md:px-8 md:py-0 md:first:pl-0 md:last:pr-0"
        >
          <span class="text-neutral-600 font-mono text-sm tabular-nums">
            {milestone.day}
          </span>

          <h3 class="text-xl font-medium tracking-tight">{milestone.title}</h3>

          <p class="text-neutral-400 leading-relaxed">
            {milestone.description}
          </p>
        </div>
      {/each}
    </div>

    <div class="flex justify-center">
      <a
        href={resolve('/demo-dashboard')}
        class="btn btn-subtle rounded-full px-5 font-medium"
        data-posthog-id="how-it-works-demo-cta"
      >
        See the live demo
        <ArrowRightIcon class="size-4" />
      </a>
    </div>
  </div>
</LandingSection>
