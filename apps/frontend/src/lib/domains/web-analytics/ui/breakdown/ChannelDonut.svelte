<script lang="ts">
  import * as d3 from 'd3';
  import { formatCount, formatPercent } from '../../domain/analytics-format';
  import type { WebAnalyticsBreakdownRow } from '../../domain/web-analytics';

  type Props = {
    rows: WebAnalyticsBreakdownRow[];
    onselect: (row: WebAnalyticsBreakdownRow) => void;
  };

  const { rows, onselect }: Props = $props();

  const FILLS = [
    'var(--fg-default)',
    'var(--fg-secondary)',
    'var(--fg-tertiary)',
    'var(--fg-muted)',
    'var(--fg-faint)',
    'var(--fg-disabled)',
    'var(--surface-150-bg)',
  ];

  let width = $state(0);
  let hovered = $state<string | null>(null);

  const height = 260;
  const radius = $derived(Math.min(height / 2 - 34, width / 2 - 125, 96));
  const total = $derived(d3.sum(rows, (row) => row.visitors));
  const arcs = $derived(
    d3
      .pie<WebAnalyticsBreakdownRow>()
      .value((row) => row.visitors)
      .sort(null)
      .padAngle(0.012)(rows),
  );
  const arc = $derived(
    d3
      .arc<d3.PieArcDatum<WebAnalyticsBreakdownRow>>()
      .innerRadius(radius * 0.62)
      .outerRadius(radius)
      .cornerRadius(3),
  );
  const focused = $derived(
    rows.find((row) => row.name === hovered) ?? rows[0] ?? null,
  );

  function onArcKeydown(
    event: KeyboardEvent,
    row: WebAnalyticsBreakdownRow,
  ): void {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    onselect(row);
  }

  function labelPoints(datum: d3.PieArcDatum<WebAnalyticsBreakdownRow>): {
    line: string;
    x: number;
    y: number;
    anchor: 'start' | 'end';
  } {
    const angle = (datum.startAngle + datum.endAngle) / 2 - Math.PI / 2;
    const right = Math.cos(angle) >= 0;
    const start = [Math.cos(angle) * radius, Math.sin(angle) * radius];
    const bend = [
      Math.cos(angle) * (radius + 14),
      Math.sin(angle) * (radius + 14),
    ];
    const end = [bend[0] + (right ? 14 : -14), bend[1]];
    return {
      line: `M${start[0]},${start[1]}L${bend[0]},${bend[1]}L${end[0]},${end[1]}`,
      x: end[0] + (right ? 6 : -6),
      y: end[1],
      anchor: right ? 'start' : 'end',
    };
  }
</script>

<div class="relative w-full" style:height="{height}px" bind:clientWidth={width}>
  {#if width && radius > 20}
    <svg
      {width}
      {height}
      class="block"
      role="group"
      aria-label="Visitors by channel"
    >
      <g transform="translate({width / 2},{height / 2})">
        {#each arcs as datum, index (datum.data.name)}
          {@const label = labelPoints(datum)}
          {@const share = datum.data.visitors / total}
          <path
            d={arc(datum)}
            fill={FILLS[Math.min(index, FILLS.length - 1)]}
            stroke="var(--surface-50-bg)"
            stroke-width={hovered === datum.data.name ? 0 : 1}
            class="cursor-pointer outline-none"
            role="button"
            tabindex="0"
            aria-label="{datum.data.name}: {datum.data
              .visitors} visitors. Filter by this channel"
            onpointerenter={() => (hovered = datum.data.name)}
            onpointerleave={() => (hovered = null)}
            onfocus={() => (hovered = datum.data.name)}
            onblur={() => (hovered = null)}
            onclick={() => onselect(datum.data)}
            onkeydown={(event) => onArcKeydown(event, datum.data)}
          />
          {#if share >= 0.04}
            <path
              d={label.line}
              fill="none"
              stroke="var(--fg-disabled)"
              aria-hidden="true"
            />
            <text
              x={label.x}
              y={label.y}
              dy="0.32em"
              text-anchor={label.anchor}
              class={[
                'text-xs',
                hovered === datum.data.name
                  ? 'fill-fg-default'
                  : 'fill-fg-tertiary',
              ]}
              aria-hidden="true"
            >
              {datum.data.name}
            </text>
          {/if}
        {/each}
      </g>
    </svg>
    {#if focused}
      <div
        class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center"
        aria-hidden="true"
      >
        <span class="text-lg font-semibold tabular-nums">
          {formatPercent((focused.visitors / total) * 100)}
        </span>
        <span class="text-fg-muted max-w-24 truncate text-xs">
          {focused.name}
        </span>
        <span class="text-fg-muted text-[11px] tabular-nums">
          {formatCount(focused.visitors)} visitors
        </span>
      </div>
    {/if}
  {/if}
</div>
