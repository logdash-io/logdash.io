<script lang="ts">
  import * as d3 from 'd3';

  type Props = {
    values: number[];
  };

  const { values }: Props = $props();

  const WIDTH = 100;
  const HEIGHT = 40;

  const id = $props.id();
  const points = $derived(values.length > 1 ? values : [0, 0]);
  const hasData = $derived(points.some((value) => value > 0));
  const x = $derived(
    d3
      .scaleLinear()
      .domain([0, points.length - 1])
      .range([0, WIDTH]),
  );
  const y = $derived(
    d3
      .scaleLinear()
      .domain([0, Math.max(1, ...points)])
      .range([HEIGHT - 1, 2]),
  );
  const line = $derived(
    d3
      .line<number>()
      .x((_, index) => x(index))
      .y((value) => y(value))
      .curve(d3.curveMonotoneX)(points) ?? '',
  );
  const area = $derived(
    d3
      .area<number>()
      .x((_, index) => x(index))
      .y0(HEIGHT)
      .y1((value) => y(value))
      .curve(d3.curveMonotoneX)(points) ?? '',
  );
</script>

<svg
  viewBox="0 0 {WIDTH} {HEIGHT}"
  preserveAspectRatio="none"
  class="h-20 w-full overflow-visible"
  aria-hidden="true"
>
  <defs>
    <linearGradient id="{id}-fill" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stop-color="var(--fg-default)" stop-opacity="0.14" />
      <stop offset="1" stop-color="var(--fg-default)" stop-opacity="0" />
    </linearGradient>
  </defs>

  {#if hasData}
    <path d={area} fill="url(#{id}-fill)" />
  {/if}

  <path
    d={line}
    fill="none"
    stroke={hasData ? 'var(--fg-default)' : 'var(--fg-disabled)'}
    stroke-width="1.5"
    stroke-linecap="round"
    stroke-linejoin="round"
    vector-effect="non-scaling-stroke"
  />
</svg>
