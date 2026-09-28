<script lang="ts">
  import type { Bucket, Monitor } from '@logdash/status';
  import LensPage from './LensPage.svelte';
  import {
    formatUptime,
    getLensHover,
    type LensLabels,
    type SkinProps,
  } from './skin-data';
  import {
    CHART_ROWS,
    plotCandles,
    walkCandles,
    type CandleShape,
  } from './stonks-candles';

  type Quote = {
    ohlc: string;
    change: string;
  };

  const { page }: SkinProps = $props();

  const LABELS: LensLabels = {
    page: {
      operational: 'TO THE MOON',
      degraded: 'BUY THE DIP',
      outage: 'HODL',
      unknown: 'MARKET CLOSED',
    },
    monitor: {
      up: 'BULLISH',
      degraded: 'VOLATILE',
      down: 'CRASHED',
      unknown: 'HALTED',
    },
    uptime: {
      '24h': '24H YIELD',
      '7d': '7D YIELD',
      '30d': '30D YIELD',
      '90d': '90D YIELD',
    },
    updated: 'NOT FINANCIAL ADVICE',
    since: (days) => `${days}D AGO`,
    today: 'NOW',
    day: {
      uptime: (percent) => `UPTIME ${percent}`,
      checks: (count, latencyMs) =>
        latencyMs === null ? `VOL ${count}` : `VOL ${count} · ${latencyMs}MS`,
      empty: 'PRE-IPO',
    },
  };

  const PHONE_DAYS = 30;
  const TAPE_LAPS = 4;
  const TAG_FLIP = 0.5;
  const WIDE_DECIMALS = 2;
  const PHONE_DECIMALS = 1;

  const hover = getLensHover();
  const hovered = $derived(
    page.monitors.find((monitor) => monitor.id === hover.monitor),
  );
  const wide = $derived(
    hovered && hover.day !== null
      ? quote(hovered.history.daily, hover.day, WIDE_DECIMALS)
      : undefined,
  );
  const narrow = $derived(
    hovered && hover.day !== null
      ? quote(
          hovered.history.daily.slice(-PHONE_DAYS),
          hover.day - phoneOffset(hovered.history.daily),
          PHONE_DECIMALS,
        )
      : undefined,
  );

  function quote(
    days: Bucket[],
    index: number,
    decimals: number,
  ): Quote | undefined {
    const candle = walkCandles(days)[index];

    if (!candle) return undefined;

    const change = (candle.close / candle.open - 1) * 100;

    return {
      ohlc: JSON.stringify(
        `O ${candle.open.toFixed(decimals)} H ${candle.high.toFixed(decimals)} L ${candle.low.toFixed(decimals)} C ${candle.close.toFixed(decimals)}`,
      ),
      change: JSON.stringify(`${change < 0 ? '' : '+'}${change.toFixed(2)}%`),
    };
  }

  function phoneOffset(days: Bucket[]): number {
    return Math.max(0, days.length - PHONE_DAYS);
  }

  function openIn(monitor: Monitor, offset: number): number {
    if (hover.monitor !== monitor.id || hover.day === null) return -1;

    return hover.day - offset;
  }

  function closeAt(shape: CandleShape): number {
    return shape.rising
      ? shape.bodyTop
      : shape.bodyTop + shape.bodyHeight - 100 / CHART_ROWS;
  }
</script>

<div
  class="stonks h-full"
  style:--ohlc-wide={wide?.ohlc}
  style:--change-wide={wide?.change}
  style:--ohlc-narrow={narrow?.ohlc}
  style:--change-narrow={narrow?.change}
>
  <LensPage {page} labels={LABELS} chart={candles}>
    <div
      class="absolute inset-x-0 top-48 h-4 overflow-hidden text-xs leading-4 whitespace-nowrap sm:top-44"
    >
      <div class="tape flex w-max">
        {#each [0, 1] as half (half)}
          <div class="flex">
            {#each { length: TAPE_LAPS }, lap (lap)}
              {#each page.monitors as monitor (monitor.id)}
                <span
                  class="quote flex items-center gap-1.5 pr-8"
                  data-status={monitor.status}
                >
                  <span class="symbol">${monitor.name}</span>
                  <span class="tick"></span>
                  {formatUptime(monitor.uptime['90d'])}
                </span>
              {/each}
            {/each}
          </div>
        {/each}
      </div>
    </div>
  </LensPage>
</div>

{#snippet candles(monitor: Monitor)}
  {@const daily = monitor.history.daily}
  {@render candleRow(monitor, daily, 0, false)}
  {@render candleRow(
    monitor,
    daily.slice(-PHONE_DAYS),
    phoneOffset(daily),
    true,
  )}
{/snippet}

{#snippet candleRow(
  monitor: Monitor,
  days: Bucket[],
  offset: number,
  phone: boolean,
)}
  {@const shapes = plotCandles(days)}
  {@const walk = walkCandles(days)}
  {@const open = openIn(monitor, offset)}
  {@const openShape = shapes[open]}
  {@const openCandle = walk[open]}
  <div
    class={[
      'relative flex h-full',
      phone ? 'gap-px sm:hidden' : 'gap-0.5 max-sm:hidden',
    ]}
  >
    {#each days as day, index (day.timestamp)}
      {@const shape = shapes[index]}
      <span
        class={['relative min-w-0 flex-1 basis-0', { open: index === open }]}
      >
        {#if index === open}
          <span class="cross-x"></span>
        {/if}
        {#if shape}
          <span
            class={['volume', { falling: !shape.rising }]}
            style:height="{shape.volumeHeight}%"
          ></span>
          <span
            class={['wick', { falling: !shape.rising }]}
            style:top="{shape.wickTop}%"
            style:height="{shape.wickHeight}%"
          ></span>
          <span
            class={['body', { falling: !shape.rising }]}
            style:top="{shape.bodyTop}%"
            style:height="{shape.bodyHeight}%"
          ></span>
        {/if}
      </span>
    {/each}

    {#if openShape && openCandle}
      <span class="cross-y" style:top="{closeAt(openShape)}%"></span>
      <span
        class={['tag', open > days.length * TAG_FLIP ? 'at-left' : 'at-right']}
        style:top="{closeAt(openShape)}%"
      >
        {openCandle.close.toFixed(phone ? PHONE_DECIMALS : WIDE_DECIMALS)}
      </span>
    {/if}
  </div>
{/snippet}

<style>
  .stonks {
    --stonks-amber: #ffb000;
    --stonks-dim: #b87e00;
    --stonks-green: #00d26a;
    --stonks-red: #ff4d4d;
    --stonks-grey: #8c8c8c;
    --stonks-grid: #2b1e00;
    --lens-bg: #000000;
    --lens-fg: var(--stonks-amber);
    --lens-muted: var(--stonks-dim);
    --lens-line: #5c3f00;
    --lens-font: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
    --lens-mono: var(--lens-font);
  }

  .stonks :global([data-part='page']) {
    text-transform: uppercase;
    font-variant-numeric: tabular-nums;
  }

  .stonks :global([data-part='name']) {
    padding-inline: 6px;
    background: var(--stonks-amber);
    color: #000000;
    font-weight: 700;
    letter-spacing: 0.08em;
  }

  .stonks :global([data-part='name'])::before,
  .stonks :global([data-part='monitor-name'])::before {
    content: '$';
  }

  .stonks :global([data-part='headline']) {
    font-weight: 700;
    letter-spacing: -0.02em;
    text-shadow: 0 0 20px #ffb00055;
  }

  .stonks :global([data-part='updated']) {
    position: relative;
    letter-spacing: 0.08em;
  }

  .stonks :global([data-part='updated'])::after {
    position: absolute;
    top: 2px;
    left: calc(100% + 4px);
    width: 8px;
    height: 16px;
    background: var(--stonks-dim);
    content: '';
  }

  .stonks :global([data-part='monitor-name']),
  .stonks :global([data-part='monitor-status']),
  .stonks :global([data-part='stat-value']) {
    font-weight: 700;
  }

  .stonks :global([data-part='monitor-status']),
  .stonks :global([data-part='stat-label']) {
    letter-spacing: 0.08em;
  }

  .stonks :global([data-status]) {
    --tick: var(--stonks-grey);
    --tick-shape: inset(38% 0);
  }

  .stonks :global([data-status='operational']),
  .stonks :global([data-status='up']) {
    --tick: var(--stonks-green);
    --tick-shape: polygon(50% 0, 100% 100%, 0 100%);
  }

  .stonks :global([data-status='degraded']) {
    --tick: var(--stonks-amber);
    --tick-shape: polygon(0 0, 100% 0, 50% 100%);
  }

  .stonks :global([data-status='outage']),
  .stonks :global([data-status='down']) {
    --tick: var(--stonks-red);
    --tick-shape: polygon(0 0, 100% 0, 50% 100%);
  }

  .stonks :global([data-part='mark']) {
    background: none;
  }

  .stonks :global([data-part='mark'])::before {
    position: absolute;
    inset: -3px;
    background: var(--tick);
    clip-path: var(--tick-shape);
    content: '';
  }

  .stonks :global([data-part='headline'] [data-part='mark'])::before {
    inset: -3px -5px;
  }

  .stonks :global([data-part='mark'] + [data-part='monitor-status']) {
    color: var(--stonks-grey);
  }

  .stonks
    :global(
      [data-part='mark'][data-status='up'] + [data-part='monitor-status']
    ) {
    color: var(--stonks-green);
  }

  .stonks
    :global(
      [data-part='mark'][data-status='degraded'] + [data-part='monitor-status']
    ) {
    color: var(--stonks-amber);
  }

  .stonks
    :global(
      [data-part='mark'][data-status='down'] + [data-part='monitor-status']
    ) {
    color: var(--stonks-red);
  }

  .stonks :global([data-part='chart']) {
    background:
      repeating-linear-gradient(
        to bottom,
        var(--stonks-grid) 0 1px,
        transparent 1px 12px
      ),
      linear-gradient(to top, var(--stonks-grid) 0 1px, transparent 1px);
  }

  .quote {
    color: var(--tick);
  }

  .symbol {
    color: var(--stonks-amber);
  }

  .tick {
    width: 8px;
    height: 7px;
    background: var(--tick);
    clip-path: var(--tick-shape);
  }

  .wick {
    position: absolute;
    left: calc(50% - 0.5px);
    width: 1px;
    background: var(--stonks-green);
  }

  .body {
    position: absolute;
    inset-inline: 1px;
    background: var(--stonks-green);
  }

  .falling {
    background: var(--stonks-red);
  }

  .volume {
    position: absolute;
    bottom: 0;
    inset-inline: 1px;
    background: #0e6b3e;
  }

  .volume.falling {
    background: #8a2626;
  }

  .open .wick,
  .open .body,
  .open .volume {
    z-index: 12;
  }

  .open .wick,
  .open .body {
    background: #8cffc0;
    box-shadow: 0 0 6px var(--stonks-green);
  }

  .open .wick.falling,
  .open .body.falling {
    background: #ffa3a3;
    box-shadow: 0 0 6px var(--stonks-red);
  }

  .open .volume {
    background: #16a05c;
  }

  .open .volume.falling {
    background: #c43a3a;
  }

  .cross-x {
    position: absolute;
    top: -8px;
    bottom: 0;
    left: calc(50% - 0.5px);
    z-index: 11;
    width: 1px;
    background: repeating-linear-gradient(
      to bottom,
      var(--stonks-amber) 0 3px,
      transparent 3px 6px
    );
  }

  .cross-y {
    position: absolute;
    inset-inline: 0;
    height: 1px;
    background: repeating-linear-gradient(
      to right,
      var(--stonks-amber) 0 3px,
      transparent 3px 6px
    );
  }

  .tag {
    position: absolute;
    height: 11px;
    translate: 0 -5px;
    background: var(--stonks-amber);
    color: #000000;
    font-size: 10px;
    font-weight: 700;
    line-height: 11px;
  }

  .at-left {
    left: 0;
    padding-inline: 3px 8px;
    clip-path: polygon(
      0 0,
      calc(100% - 5px) 0,
      100% 50%,
      calc(100% - 5px) 100%,
      0 100%
    );
  }

  .at-right {
    right: 0;
    padding-inline: 8px 3px;
    clip-path: polygon(5px 0, 100% 0, 100% 100%, 5px 100%, 0 50%);
  }

  .stonks :global([data-part='tooltip']) {
    gap: 2px;
    padding: 0 0 5px;
    border-color: var(--stonks-amber);
    border-radius: 0;
    background: #000000;
    box-shadow:
      0 0 0 3px #000000,
      0 0 12px 3px #ffb00026;
  }

  .stonks :global([data-part='tooltip'] p),
  .stonks :global([data-part='tooltip'])::after {
    padding-inline: 8px;
    font-size: 12px;
    line-height: 16px;
  }

  .stonks :global([data-part='tooltip-date']) {
    display: flex;
    column-gap: 1ch;
    margin-bottom: 2px;
    background: var(--stonks-amber);
    color: #000000;
    font-weight: 700;
  }

  .stonks :global([data-part='tooltip-date'])::after {
    margin-inline: auto -8px;
    padding-inline: 6px;
    background: var(--stonks-red);
    content: var(--change-wide, none);
  }

  .stonks
    :global(
      [data-part='tooltip'][data-status='up'] [data-part='tooltip-date']
    )::after {
    background: var(--stonks-green);
  }

  .stonks :global([data-part='tooltip-zone']) {
    color: #000000;
    font-weight: 400;
  }

  .stonks :global([data-part='tooltip-mark'][data-status]) {
    width: 8px;
    height: 7px;
    border-radius: 0;
    background: var(--tick);
    clip-path: var(--tick-shape);
  }

  .stonks :global([data-part='tooltip-checks']) {
    order: 1;
  }

  .stonks :global([data-part='tooltip-checks'])::after {
    display: inline-block;
    width: 7px;
    height: 12px;
    margin-left: 4px;
    vertical-align: -1px;
    background: var(--stonks-dim);
    content: '';
  }

  .stonks :global([data-part='tooltip'])::after {
    color: var(--stonks-red);
    content: var(--ohlc-wide, none);
  }

  .stonks :global([data-part='tooltip'][data-status='up'])::after {
    color: var(--stonks-green);
  }

  @media (width < 40rem) {
    .stonks :global([data-part='tooltip'])::after {
      content: var(--ohlc-narrow, none);
    }

    .stonks :global([data-part='tooltip-date'])::after {
      content: var(--change-narrow, none);
    }
  }

  @media (prefers-reduced-motion: no-preference) {
    .tape {
      animation: tape 90s linear infinite;
    }

    .stonks :global([data-part='updated'])::after,
    .stonks :global([data-part='tooltip-checks'])::after {
      animation: blink 1.2s steps(1) infinite;
    }
  }

  @keyframes tape {
    to {
      translate: -50% 0;
    }
  }

  @keyframes blink {
    50% {
      visibility: hidden;
    }
  }
</style>
