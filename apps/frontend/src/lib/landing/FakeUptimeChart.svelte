<script lang="ts">
  import { prefersReducedMotion } from 'svelte/motion';
  import { countTrailing } from './live-feed';
  import LiveAlertCard from './LiveAlertCard.svelte';
  import ResponseTimePlot from './ResponseTimePlot.svelte';

  const VISIBLE_CHECKS = 60;
  const TICK_MS = 1_000;
  const CHECK_EVERY_S = 15;
  const SETTLE_CHECKS = 5;
  const MAX_RESPONSE_MS = 400;
  const VIEWBOX_WIDTH = 240;
  const VIEWBOX_HEIGHT = 72;
  const STEP = VIEWBOX_WIDTH / (VISIBLE_CHECKS - 1);
  const LOOP = [
    132, 118, 141, 126, 147, 129, 168, 214, 0, 0, 246, 171, 138, 121, 144, 127,
    152, 133, 119, 139, 128, 146, 124, 137, 155, 131, 117, 142, 129, 136, 149,
    122, 134, 158, 127, 119, 143, 131, 138, 124, 151, 129, 117, 140, 133, 126,
    148, 121, 135, 144, 139, 152, 166, 183, 207, 238, 276, 318, 0, 0, 0, 0, 0,
    297, 214, 169, 147, 131, 138, 122, 134, 145, 127, 139, 118, 131, 148, 126,
    137, 129,
  ];
  const FIRST_LIVE_INDEX = 50;

  let checks = $state<number[]>(
    Array.from(
      { length: VISIBLE_CHECKS + 1 },
      (_, index) =>
        LOOP[
          (FIRST_LIVE_INDEX - VISIBLE_CHECKS + index + LOOP.length) %
            LOOP.length
        ],
    ),
  );
  let plot = $state<SVGGElement | null>(null);
  let cursor = FIRST_LIVE_INDEX;
  let slide: Animation | null = null;

  const current = $derived(checks[checks.length - 1]);
  const upFor = $derived(countTrailing(checks, isUp));
  const downFor = $derived(
    countTrailing(checks.slice(0, checks.length - upFor), isDown),
  );

  $effect(() => {
    const timer = window.setInterval(() => {
      checks = [...checks.slice(1), nextCheck()];
      startSlide();
    }, TICK_MS);

    return () => {
      window.clearInterval(timer);
      slide?.cancel();
    };
  });

  function isUp(responseMs: number): boolean {
    return responseMs > 0;
  }

  function isDown(responseMs: number): boolean {
    return responseMs === 0;
  }

  function nextCheck(): number {
    cursor = (cursor + 1) % LOOP.length;
    const responseMs = LOOP[cursor];

    return isDown(responseMs)
      ? 0
      : responseMs + Math.round((Math.random() - 0.5) * 12);
  }

  function startSlide(): void {
    if (!plot || prefersReducedMotion.current) {
      return;
    }

    slide?.cancel();
    slide = plot.animate(
      [
        { transform: 'translateX(0px)' },
        { transform: `translateX(${-STEP}px)` },
      ],
      { duration: TICK_MS, easing: 'linear', fill: 'forwards' },
    );
  }

  function toDuration(checkCount: number): string {
    const seconds = checkCount * CHECK_EVERY_S;
    const minutes = Math.floor(seconds / 60);
    const rest = seconds % 60;

    if (!minutes) {
      return `${rest} s`;
    }

    return rest ? `${minutes} min ${rest} s` : `${minutes} min`;
  }
</script>

<div class="flex h-full w-full flex-col gap-5">
  <div class="relative flex gap-x-10 sm:gap-x-14">
    <div class="flex min-w-24 flex-col gap-0.5">
      <span class="text-neutral-500 text-xs">Response</span>
      {#if isDown(current)}
        <span class="text-error text-2xl font-medium">Down</span>
      {:else}
        <span class="text-2xl font-medium tabular-nums">{current} ms</span>
      {/if}
    </div>

    <div class="hidden flex-col gap-0.5 sm:flex">
      <span class="text-neutral-500 text-xs">30 d uptime</span>
      <span class="text-2xl font-medium tabular-nums">99.97%</span>
    </div>

    {#if isDown(current)}
      <LiveAlertCard
        dot="bg-error"
        title="Down for {toDuration(countTrailing(checks, isDown))}"
        detail="Alert sent to Telegram"
      />
    {:else if downFor && upFor <= SETTLE_CHECKS}
      <LiveAlertCard
        dot="bg-success"
        title="Back up"
        detail="Down for {toDuration(downFor)}"
      />
    {/if}
  </div>

  <div class="relative min-h-16 flex-1">
    <svg
      class="absolute inset-0 size-full"
      viewBox="0 0 {VIEWBOX_WIDTH} {VIEWBOX_HEIGHT}"
      preserveAspectRatio="none"
      role="img"
      aria-label="Response time of api.acme.com over the last {VISIBLE_CHECKS} checks, with the minutes it was down marked in red"
    >
      <g bind:this={plot} transform="translate({-STEP} 0)">
        <ResponseTimePlot
          responseTimes={checks}
          step={STEP}
          height={VIEWBOX_HEIGHT}
          maxMs={MAX_RESPONSE_MS}
        />
      </g>
    </svg>
  </div>

  <div
    class="text-neutral-600 flex items-center justify-between font-mono text-xs"
  >
    <span>15 min ago</span>
    <span>Now</span>
  </div>
</div>
