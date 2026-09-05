<script lang="ts">
  import { prefersReducedMotion } from 'svelte/motion';

  const gradientId = $props.id();

  const VISIBLE_SAMPLES = 40;
  const SAMPLE_MS = 1_500;
  const VIEWBOX_WIDTH = 240;
  const VIEWBOX_HEIGHT = 72;
  const STEP = VIEWBOX_WIDTH / (VISIBLE_SAMPLES - 1);
  const SEED = [
    38, 41, 37, 44, 52, 47, 43, 49, 58, 63, 55, 48, 45, 51, 46, 42, 39, 44, 57,
    66, 61, 54, 49, 47, 53, 59, 64, 71, 62, 56, 50, 46, 44, 48, 55, 61, 58, 52,
    47, 45, 43,
  ];

  let samples = $state<number[]>(SEED);
  let plot = $state<SVGGElement | null>(null);
  let slide: Animation | null = null;

  const current = $derived(samples[samples.length - 1]);
  const peak = $derived(Math.max(...samples));

  const points = $derived(
    samples
      .map((value, index) => `${(index * STEP).toFixed(2)},${toY(value)}`)
      .join(' '),
  );
  const areaPoints = $derived(
    `0,${VIEWBOX_HEIGHT} ${points} ${(VISIBLE_SAMPLES * STEP).toFixed(2)},${VIEWBOX_HEIGHT}`,
  );

  $effect(() => {
    const timer = window.setInterval(() => {
      samples = [...samples.slice(1), nextSample(samples[samples.length - 1])];
      startSlide();
    }, SAMPLE_MS);

    return () => {
      window.clearInterval(timer);
      slide?.cancel();
    };
  });

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

  function nextSample(previous: number): number {
    const drift = (Math.random() - 0.5) * 14;
    const spike = Math.random() < 0.06 ? 18 : 0;
    const pullToBaseline = (46 - previous) * 0.12;

    return Math.round(
      Math.min(96, Math.max(8, previous + drift + spike + pullToBaseline)),
    );
  }

  function toY(value: number): string {
    return (VIEWBOX_HEIGHT - (value / 100) * (VIEWBOX_HEIGHT - 8) - 4).toFixed(
      2,
    );
  }
</script>

<div class="flex h-full w-full flex-col gap-5">
  <div class="flex flex-col gap-0.5">
    <span class="text-neutral-500 text-xs">Live metric</span>
    <h3 class="text-base font-medium">CPU usage</h3>
  </div>

  <div class="flex flex-wrap gap-x-10 gap-y-3 sm:gap-x-14">
    <div class="flex flex-col gap-0.5">
      <span class="text-neutral-500 text-xs">Now</span>
      <span class="text-2xl font-medium tabular-nums">{current}%</span>
    </div>

    <div class="flex flex-col gap-0.5">
      <span class="text-neutral-500 text-xs">60 s peak</span>
      <span class="text-2xl font-medium tabular-nums">{peak}%</span>
    </div>
  </div>

  <svg
    class="min-h-16 w-full flex-1"
    viewBox="0 0 {VIEWBOX_WIDTH} {VIEWBOX_HEIGHT}"
    preserveAspectRatio="none"
    role="img"
    aria-label="CPU usage over the last 60 seconds"
  >
    <defs>
      <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
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
    </defs>

    <g bind:this={plot}>
      <polygon points={areaPoints} fill="url(#{gradientId})" />

      <polyline
        {points}
        fill="none"
        stroke="var(--color-primary)"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        vector-effect="non-scaling-stroke"
      />
    </g>
  </svg>

  <div
    class="text-neutral-600 flex items-center justify-between font-mono text-xs"
  >
    <span>60 s ago</span>
    <span>Now</span>
  </div>
</div>
