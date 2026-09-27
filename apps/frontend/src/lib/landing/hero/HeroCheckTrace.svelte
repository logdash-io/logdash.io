<script lang="ts">
  type Props = {
    width: number;
    height: number;
  };

  const { width, height }: Props = $props();

  const BASELINE_Y = 38;
  const BEAT_STARTS = [44, 150];
  const SWEEP_SPAN = 110;

  const id = $props.id();

  const trace = $derived(
    [
      `M0 ${BASELINE_Y}`,
      ...BEAT_STARTS.map(
        (x) =>
          `H${x} q2.5 -4 5 0 H${x + 11} l1.5 3 l2 -25 l2 29 l1.5 -7 H${x + 26} q4 -7 8 0`,
      ),
      `H${width}`,
    ].join(' '),
  );
</script>

<svg
  class="h-14 w-full"
  viewBox="0 0 {width} {height}"
  preserveAspectRatio="none"
  aria-hidden="true"
  style:--sweep-from="{-SWEEP_SPAN}px"
  style:--sweep-to="{width}px"
  style:--sweep-rest="{BEAT_STARTS[0] + 36 - SWEEP_SPAN}px"
>
  <defs>
    <linearGradient id="{id}-tail" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="white" stop-opacity="0" />
      <stop offset="92%" stop-color="white" stop-opacity="1" />
      <stop offset="100%" stop-color="white" stop-opacity="0" />
    </linearGradient>

    <mask
      id="{id}-sweep"
      maskUnits="userSpaceOnUse"
      x="0"
      y="0"
      {width}
      {height}
    >
      <rect
        class="sweep"
        x="0"
        y="0"
        width={SWEEP_SPAN}
        {height}
        fill="url(#{id}-tail)"
      />
    </mask>
  </defs>

  <path
    d="M0 {BASELINE_Y} H{width}"
    fill="none"
    stroke="var(--color-neutral-800)"
    stroke-width="1"
    vector-effect="non-scaling-stroke"
  />

  <path
    d={trace}
    fill="none"
    stroke="var(--color-neutral-500)"
    stroke-width="1.5"
    stroke-linecap="round"
    stroke-linejoin="round"
    vector-effect="non-scaling-stroke"
    mask="url(#{id}-sweep)"
  />
</svg>

<style>
  .sweep {
    animation: sweep 1.6s linear infinite;
  }

  @keyframes sweep {
    from {
      transform: translateX(var(--sweep-from));
    }
    to {
      transform: translateX(var(--sweep-to));
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .sweep {
      animation: none;
      transform: translateX(var(--sweep-rest));
    }
  }
</style>
