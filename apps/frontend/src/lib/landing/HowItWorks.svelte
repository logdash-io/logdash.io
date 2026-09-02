<script lang="ts">
  import { resolve } from '$app/paths';
  import {
    animatedViewState,
    AnimationDirection,
  } from '$lib/domains/shared/ui/animated-view.state.svelte.js';
  import { ArrowRightIcon } from 'lucide-svelte';

  type Step = {
    number: number;
    title: string;
    description: string;
  };

  const STEPS: Step[] = [
    {
      number: 1,
      title: 'Paste your URL.',
      description: 'Monitoring starts in seconds.',
    },
    {
      number: 2,
      title: 'Paste our prompt into your LLM.',
      description: 'Logs and metrics wired in minutes.',
    },
    {
      number: 3,
      title: 'Get alerted.',
      description: 'Telegram, Discord, webhook.',
    },
  ];

  function onSeeDemo(): void {
    animatedViewState.nextAnimationDirection = AnimationDirection.LEFT;
  }
</script>

<section id="how-it-works" class="w-full rounded-3xl px-4">
  <div class="mx-auto max-w-5xl">
    <div class="mb-12 text-center">
      <h2
        class="text-secondary mb-4 text-4xl font-extrabold tracking-tighter sm:text-5xl"
      >
        Live in two minutes
      </h2>
      <p class="text-base-content/70 text-lg">
        Three steps, no infrastructure to run. We handle the rest.
      </p>
    </div>

    <div
      class="bg-base-200/80 border-base-100 grid grid-cols-1 gap-8 rounded-3xl border-t p-8 md:grid-cols-3 md:grid-rows-[auto_auto_auto] md:gap-x-8 md:gap-y-0 md:p-10"
    >
      {#each STEPS as step (step.number)}
        <div
          class="flex flex-col gap-4 md:row-span-3 md:grid md:grid-rows-subgrid md:gap-y-4"
        >
          <div
            class="bg-base-100/60 border-base-100 flex size-14 shrink-0 items-center justify-center rounded-2xl border-t text-2xl font-bold"
          >
            {step.number}
          </div>

          <h3 class="text-base-content text-xl font-semibold">
            {step.title}
          </h3>

          <p class="text-base-content/70 text-base leading-relaxed">
            {step.description}
          </p>
        </div>
      {/each}
    </div>

    <div class="mx-auto mt-12 w-fit">
      <a
        onclick={onSeeDemo}
        href={resolve('/demo-dashboard')}
        class="btn btn-secondary gap-1"
        data-posthog-id="how-it-works-demo-cta"
      >
        See the live demo
        <ArrowRightIcon class="size-4" />
      </a>
    </div>
  </div>
</section>
