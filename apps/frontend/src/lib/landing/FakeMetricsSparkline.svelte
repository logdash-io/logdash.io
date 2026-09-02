<script lang="ts">
  const VALUES = [
    18, 22, 19, 27, 24, 31, 29, 38, 34, 41, 46, 43, 52, 49, 58, 55, 64, 71, 67,
    78, 74, 86, 91, 88, 97,
  ];

  const VIEWBOX_WIDTH = 240;
  const VIEWBOX_HEIGHT = 72;

  const minValue = Math.min(...VALUES);
  const maxValue = Math.max(...VALUES);

  const points = VALUES.map((value, index) => {
    const x = (index / (VALUES.length - 1)) * VIEWBOX_WIDTH;
    const y =
      VIEWBOX_HEIGHT -
      ((value - minValue) / (maxValue - minValue)) * (VIEWBOX_HEIGHT - 8) -
      4;

    return `${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(' ');

  const areaPoints = `0,${VIEWBOX_HEIGHT} ${points} ${VIEWBOX_WIDTH},${VIEWBOX_HEIGHT}`;
</script>

<div
  class="ld-card-base flex h-full w-full flex-col gap-4 rounded-2xl p-5 sm:p-6"
>
  <div class="flex items-start justify-between gap-4">
    <div class="flex flex-col gap-1">
      <span
        class="text-base-content/40 text-[11px] font-semibold tracking-[0.14em] uppercase"
      >
        Signups today
      </span>
      <span class="text-2xl font-semibold tabular-nums">1,284</span>
    </div>

    <span
      class="bg-success/15 text-success shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums"
    >
      +18.4%
    </span>
  </div>

  <svg
    class="min-h-16 w-full flex-1"
    viewBox="0 0 {VIEWBOX_WIDTH} {VIEWBOX_HEIGHT}"
    preserveAspectRatio="none"
    role="img"
    aria-label="Signups trending up over the last 24 hours"
  >
    <defs>
      <linearGradient id="fake-metrics-fill" x1="0" y1="0" x2="0" y2="1">
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

    <polygon points={areaPoints} fill="url(#fake-metrics-fill)" />

    <polyline
      {points}
      fill="none"
      stroke="var(--color-primary)"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      vector-effect="non-scaling-stroke"
    />
  </svg>

  <div
    class="text-base-content/40 flex items-center justify-between font-mono text-xs"
  >
    <span>24 h ago</span>
    <span>Now</span>
  </div>
</div>
