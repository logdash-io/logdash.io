<script>
  import {
    animatedViewState,
    AnimationDirection,
  } from '$lib/domains/shared/ui/animated-view.state.svelte.js';
  import {
    ArrowRightIcon,
    ChartColumnStacked,
    LogsIcon,
    TerminalIcon,
  } from 'lucide-svelte';
  import Highlight from 'svelte-highlight';
  import { bash, typescript } from 'svelte-highlight/languages';
  import { githubDark } from 'svelte-highlight/styles';
</script>

<svelte:head>
  {@html githubDark}
</svelte:head>

<section id="how-it-works" class="px-4">
  <div class="ld-card mx-auto max-w-7xl py-10">
    <h2 class="text-secondary mb-16 text-center text-4xl font-bold">
      Get set up in 3 simple steps
    </h2>

    <div class="flex flex-col items-start justify-between gap-24 md:flex-row">
      <!-- Step 1 -->
      <div class="flex flex-1 transform flex-col items-center text-center">
        <div class="ld-card-base text-primary mb-6 rounded-full p-6">
          <TerminalIcon class="h-12 w-12" />
        </div>

        <h3 class="text-primary mb-2 text-2xl font-semibold">1. Add the SDK</h3>

        <p class="text-base-content mb-4">
          One command and you’re ready. No long setup, no detours.
        </p>

        <Highlight
          class="code-snippet selection:bg-base-100"
          language={bash}
          code={`npm i @logdash/js-sdk`}
        />
      </div>

      <!-- Step 2 -->
      <div class="flex flex-1 transform flex-col items-center text-center">
        <div class="ld-card-base text-primary mb-6 rounded-full p-6">
          <LogsIcon class="h-12 w-12" />
        </div>

        <h3 class="text-secondary mb-2 text-2xl font-semibold">
          2. Send what matters
        </h3>

        <p class="text-base-content mb-4">
          Track errors, important events, and key numbers with a few lines of
          code.
        </p>

        <Highlight
          class="code-snippet selection:bg-base-100 text-left"
          language={typescript}
          code={`logdash.error('An error');
metrics.set('connections', 5);
metrics.mutate('users', 1);`}
        />
      </div>

      <div class="flex flex-1 transform flex-col items-center text-center">
        <div class="ld-card-base text-primary mb-6 rounded-full p-6">
          <ChartColumnStacked class="h-12 w-12" />
        </div>

        <h3 class="text-secondary mb-2 text-2xl font-semibold">
          3. Get answers fast
        </h3>

        <p class="text-base-content/80 mb-4">
          See what changed, what broke, and what to do next in one simple
          dashboard.
        </p>

        <a
          onclick={() => {
            animatedViewState.nextAnimationDirection = AnimationDirection.LEFT;
          }}
          href="/demo-dashboard"
          class="btn btn-secondary"
        >
          See the live demo
          <ArrowRightIcon class="ml-1 h-5 w-5" />
        </a>
      </div>
    </div>
  </div>
</section>
