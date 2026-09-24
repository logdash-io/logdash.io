<script lang="ts">
  import { prefersReducedMotion } from 'svelte/motion';
  import { match } from 'ts-pattern';
  import { countTrailing } from './live-feed';
  import LiveAlertCard from './LiveAlertCard.svelte';

  type Sample = { value: number; alerted: boolean };

  type AlertState = 'pending' | 'firing' | 'resolved' | 'ignored';

  const id = $props.id();

  const VISIBLE_SAMPLES = 60;
  const SAMPLE_MS = 1_000;
  const THRESHOLD = 80;
  const ALERT_AFTER = 10;
  const SETTLE_SAMPLES = 5;
  const VIEWBOX_WIDTH = 240;
  const VIEWBOX_HEIGHT = 72;
  const STEP = VIEWBOX_WIDTH / (VISIBLE_SAMPLES - 1);
  const LOOP = [
    44, 47, 43, 49, 52, 48, 45, 51, 55, 50, 46, 43, 47, 53, 58, 54, 49, 46, 44,
    48, 52, 49, 45, 47, 50, 53, 49, 46, 44, 48, 61, 74, 86, 89, 85, 66, 55, 49,
    46, 51, 48, 44, 47, 52, 56, 51, 47, 45, 49, 53, 62, 71, 76, 84, 88, 86, 91,
    87, 85, 89, 93, 90, 86, 88, 92, 89, 85, 87, 84, 86, 76, 70, 63, 57, 52, 49,
    47, 45, 46, 45,
  ];
  const FIRST_LIVE_INDEX = 50;
  const THRESHOLD_Y = toY(THRESHOLD);
  const THRESHOLD_TOP = `${(THRESHOLD_Y / VIEWBOX_HEIGHT) * 100}%`;

  let samples = $state<Sample[]>(
    Array.from({ length: VISIBLE_SAMPLES + 1 }, (_, index) => ({
      value:
        LOOP[
          (FIRST_LIVE_INDEX - VISIBLE_SAMPLES + index + LOOP.length) %
            LOOP.length
        ],
      alerted: false,
    })),
  );
  let plot = $state<SVGGElement | null>(null);
  let cursor = FIRST_LIVE_INDEX;
  let tickedAt = $state(0);
  let now = $state(0);
  let slide: Animation | null = null;

  const values = $derived(samples.map((sample) => sample.value));
  const current = $derived(values[values.length - 1]);
  const peak = $derived(Math.max(...values));
  const alert = $derived(readAlert(values));
  const counting = $derived(
    alert.state === 'pending' || alert.state === 'firing',
  );
  const overMs = $derived(
    (alert.seconds - 1) * SAMPLE_MS +
      Math.min(Math.max(now - tickedAt, 0), SAMPLE_MS - 1),
  );

  const points = $derived(
    values
      .map((value, index) => `${(index * STEP).toFixed(2)},${toY(value)}`)
      .join(' '),
  );
  const areaPoints = $derived(
    `0,${VIEWBOX_HEIGHT} ${points} ${(VISIBLE_SAMPLES * STEP).toFixed(2)},${VIEWBOX_HEIGHT}`,
  );
  const markers = $derived(
    samples.flatMap((sample, index) =>
      sample.alerted
        ? [`M${(index * STEP).toFixed(2)} ${toY(sample.value)}h0`]
        : [],
    ),
  );

  const card = $derived(
    match(alert.state)
      .with('pending', () => ({
        dot: 'bg-warning',
        title: `Over ${THRESHOLD}% for ${toSeconds(overMs)} s`,
        detail: `Alert in ${toSeconds(ALERT_AFTER * SAMPLE_MS - overMs)} s`,
      }))
      .with('firing', () => ({
        dot: 'bg-error',
        title: `Over ${THRESHOLD}% for ${toSeconds(overMs)} s`,
        detail: 'Alert sent to Telegram',
      }))
      .with('resolved', () => ({
        dot: 'bg-success',
        title: `Back under ${THRESHOLD}%`,
        detail: `Resolved after ${alert.seconds} s`,
      }))
      .with('ignored', () => ({
        dot: 'bg-neutral-500',
        title: `Back under ${THRESHOLD}%`,
        detail: `${alert.seconds} s spike, no alert`,
      }))
      .exhaustive(),
  );

  $effect(() => {
    const timer = window.setInterval(() => {
      const next = [...values.slice(1), nextValue()];

      samples = [
        ...samples.slice(1),
        {
          value: next[next.length - 1],
          alerted: countTrailing(next, isOver) === ALERT_AFTER + 1,
        },
      ];
      tickedAt = performance.now();
      startSlide();
    }, SAMPLE_MS);

    return () => {
      window.clearInterval(timer);
      slide?.cancel();
    };
  });

  $effect(() => {
    if (!counting) {
      return;
    }

    let frame = requestAnimationFrame(function onFrame(time) {
      now = time;
      frame = requestAnimationFrame(onFrame);
    });

    return () => cancelAnimationFrame(frame);
  });

  function readAlert(values: number[]): {
    state: AlertState;
    seconds: number;
    visible: boolean;
  } {
    const quietFor = countTrailing(values, (value) => !isOver(value));
    const overFor = countTrailing(
      values.slice(0, values.length - quietFor),
      isOver,
    );
    const alerted = overFor > ALERT_AFTER;
    const visible = overFor > 0 && quietFor <= SETTLE_SAMPLES;

    if (quietFor) {
      return {
        state: alerted ? 'resolved' : 'ignored',
        seconds: overFor,
        visible,
      };
    }

    return { state: alerted ? 'firing' : 'pending', seconds: overFor, visible };
  }

  function toSeconds(ms: number): string {
    return (ms / 1000).toFixed(3);
  }

  function isOver(value: number): boolean {
    return value > THRESHOLD;
  }

  function nextValue(): number {
    cursor = (cursor + 1) % LOOP.length;

    return LOOP[cursor] + Math.round((Math.random() - 0.5) * 4);
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
      { duration: SAMPLE_MS, easing: 'linear', fill: 'forwards' },
    );
  }

  function toY(value: number): number {
    return Number(
      (VIEWBOX_HEIGHT - (value / 100) * (VIEWBOX_HEIGHT - 8) - 4).toFixed(2),
    );
  }
</script>

<div class="flex h-full w-full flex-col gap-5">
  <div class="relative flex gap-x-10 sm:gap-x-14">
    <div class="flex flex-col gap-0.5">
      <span class="text-neutral-500 text-xs">Now</span>
      <span
        class={[
          'text-2xl font-medium tabular-nums',
          { 'text-error': isOver(current) },
        ]}
      >
        {current}%
      </span>
    </div>

    <div class="hidden flex-col gap-0.5 sm:flex">
      <span class="text-neutral-500 text-xs">60 s peak</span>
      <span class="text-2xl font-medium tabular-nums">{peak}%</span>
    </div>

    {#if alert.visible}
      <LiveAlertCard dot={card.dot} title={card.title} detail={card.detail} />
    {/if}
  </div>

  <div class="flex min-h-16 flex-1 gap-3">
    <div class="relative flex-1">
      <svg
        class="absolute inset-x-0 h-px w-full overflow-visible"
        style:top={THRESHOLD_TOP}
        aria-hidden="true"
      >
        <line
          x1="0"
          x2="100%"
          y1="0.5"
          y2="0.5"
          stroke="var(--color-error)"
          stroke-dasharray="4 4"
        />
      </svg>

      <svg
        class="absolute inset-0 size-full"
        viewBox="0 0 {VIEWBOX_WIDTH} {VIEWBOX_HEIGHT}"
        preserveAspectRatio="none"
        role="img"
        aria-label="CPU usage over the last 60 seconds, alerting when it stays over {THRESHOLD}% for {ALERT_AFTER} seconds"
      >
        <defs>
          <linearGradient id="{id}-fill" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stop-color="var(--color-primary)"
              stop-opacity="0.28"
            />
            <stop
              offset="100%"
              stop-color="var(--color-primary)"
              stop-opacity="0"
            />
          </linearGradient>

          <linearGradient
            id="{id}-alert-fill"
            gradientUnits="userSpaceOnUse"
            x1="0"
            y1="0"
            x2="0"
            y2={THRESHOLD_Y}
          >
            <stop
              offset="0%"
              stop-color="var(--color-error)"
              stop-opacity="0.4"
            />
            <stop
              offset="100%"
              stop-color="var(--color-error)"
              stop-opacity="0.12"
            />
          </linearGradient>

          <clipPath id="{id}-over">
            <rect
              x={-VIEWBOX_WIDTH}
              y={-VIEWBOX_HEIGHT}
              width={VIEWBOX_WIDTH * 3}
              height={VIEWBOX_HEIGHT + THRESHOLD_Y}
            />
          </clipPath>

          <clipPath id="{id}-under">
            <rect
              x={-VIEWBOX_WIDTH}
              y={THRESHOLD_Y}
              width={VIEWBOX_WIDTH * 3}
              height={VIEWBOX_HEIGHT * 2}
            />
          </clipPath>
        </defs>

        <g bind:this={plot} transform="translate({-STEP} 0)">
          <g clip-path="url(#{id}-under)">
            <polygon points={areaPoints} fill="url(#{id}-fill)" />
            {@render line('var(--color-primary)')}
          </g>

          <g clip-path="url(#{id}-over)">
            <polygon points={areaPoints} fill="url(#{id}-alert-fill)" />
            {@render line('var(--color-error)')}
          </g>

          {#each markers as marker (marker)}
            <path
              d={marker}
              stroke="var(--color-base-200)"
              stroke-width="12"
              stroke-linecap="round"
              vector-effect="non-scaling-stroke"
            />
            <path
              d={marker}
              stroke="var(--color-error)"
              stroke-width="6"
              stroke-linecap="round"
              vector-effect="non-scaling-stroke"
            />
          {/each}
        </g>
      </svg>
    </div>

    <div class="relative w-8 shrink-0">
      <span
        class="text-error absolute right-0 -translate-y-1/2 font-mono text-xs"
        style:top={THRESHOLD_TOP}
      >
        {THRESHOLD}%
      </span>
    </div>
  </div>

  <div
    class="text-neutral-600 flex items-center justify-between pr-11 font-mono text-xs"
  >
    <span>60 s ago</span>
    <span>Now</span>
  </div>
</div>

{#snippet line(stroke: string)}
  <polyline
    {points}
    fill="none"
    {stroke}
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    vector-effect="non-scaling-stroke"
  />
{/snippet}
