<script lang="ts">
  import LensPage from './LensPage.svelte';
  import type { LensLabels, SkinProps } from './skin-data';

  const { page }: SkinProps = $props();

  const LABELS: LensLabels = {
    page: {
      operational: 'FULL HEALTH',
      degraded: 'YOU TOOK\nDAMAGE',
      outage: 'GAME OVER',
      unknown: 'PRESS START',
    },
    monitor: {
      up: 'FULL HP',
      degraded: 'HIT!',
      down: 'K.O.',
      unknown: 'LOADING',
    },
    uptime: {
      '24h': '24H HP',
      '7d': '7D HP',
      '30d': '30D HP',
      '90d': '90D HP',
    },
    updated: 'INSERT COIN TO CONTINUE',
    since: (days) => `${days} DAYS AGO`,
    today: 'NOW',
    day: {
      uptime: (percent) => `HP ${percent}`,
      checks: (count, latencyMs) =>
        latencyMs === null
          ? `${count} ROUNDS`
          : `${count} ROUNDS · ${latencyMs}MS LAG`,
      empty: 'LEVEL LOCKED',
    },
  };
</script>

<div class="arcade h-full">
  <LensPage {page} labels={LABELS} />
</div>

<style>
  .arcade {
    --arcade-bg: #140e3c;
    --arcade-red: #ff2e4d;
    --arcade-gold: #ffd23f;
    --arcade-cyan: #3de8ff;
    --arcade-violet: #6d5dfc;
    --arcade-lilac: #b9b3ff;
    --arcade-shade: #5a44e8;
    --heart: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 -1 7 8' shape-rendering='crispEdges'><path fill='%23ff2e4d' d='M1 0h2v1H1zM4 0h2v1H4zM0 1h7v2H0zM1 3h5v1H1zM2 4h3v1H2zM3 5h1v1H3z'/><path fill='%23ffd0d8' d='M1 1h1v1H1z'/></svg>");
    --heart-half: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 -1 7 8' shape-rendering='crispEdges'><path fill='%230b0724' d='M1 0h2v1H1zM4 0h2v1H4zM0 1h7v2H0zM1 3h5v1H1zM2 4h3v1H2zM3 5h1v1H3z'/><path fill='%237a6cff' d='M1 0h2v1H1zM4 0h2v1H4zM0 1h1v2H0zM6 1h1v2H6zM3 1h1v1H3zM1 3h1v1H1zM5 3h1v1H5zM2 4h1v1H2zM4 4h1v1H4zM3 5h1v1H3z'/><path fill='%23ff2e4d' d='M1 0h2v1H1zM0 1h4v2H0zM1 3h3v1H1zM2 4h2v1H2zM3 5h1v1H3z'/><path fill='%23ffd0d8' d='M1 1h1v1H1z'/></svg>");
    --heart-empty: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 -1 7 8' shape-rendering='crispEdges'><path fill='%230b0724' d='M1 0h2v1H1zM4 0h2v1H4zM0 1h7v2H0zM1 3h5v1H1zM2 4h3v1H2zM3 5h1v1H3z'/><path fill='%237a6cff' d='M1 0h2v1H1zM4 0h2v1H4zM0 1h1v2H0zM6 1h1v2H6zM3 1h1v1H3zM1 3h1v1H1zM5 3h1v1H5zM2 4h1v1H2zM4 4h1v1H4zM3 5h1v1H3z'/></svg>");
    --heart-locked: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 -1 7 8' shape-rendering='crispEdges'><path fill='%232d2768' d='M1 0h2v1H1zM4 0h2v1H4zM0 1h7v2H0zM1 3h5v1H1zM2 4h3v1H2zM3 5h1v1H3z'/></svg>");
    --heart-locked-lit: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 -1 7 8' shape-rendering='crispEdges'><path fill='%234a40a8' d='M1 0h2v1H1zM4 0h2v1H4zM0 1h7v2H0zM1 3h5v1H1zM2 4h3v1H2zM3 5h1v1H3z'/></svg>");
    --glyph-cursor: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 7 4' shape-rendering='crispEdges'><path fill='%23ffffff' d='M0 0h7v1H0zM1 1h5v1H1zM2 2h3v1H2zM3 3h1v1H3z'/></svg>");
    --glyph-lock: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 5 7' shape-rendering='crispEdges'><path fill='%23ffd23f' d='M1 0h3v1H1zM0 1h1v2H0zM4 1h1v2H4zM0 3h5v4H0z'/><path fill='%230b0724' d='M2 4h1v2H2z'/></svg>");
    --glyph-heart: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 7 7' shape-rendering='crispEdges'><path fill='%23ff2e4d' d='M1 0h2v1H1zM4 0h2v1H4zM0 1h7v3H0zM1 4h5v1H1zM2 5h3v1H2zM3 6h1v1H3z'/><path fill='%23ffd0d8' d='M1 1h1v1H1z'/></svg>");
    --glyph-half: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 7 7' shape-rendering='crispEdges'><path fill='%230b0724' d='M1 0h2v1H1zM4 0h2v1H4zM0 1h7v3H0zM1 4h5v1H1zM2 5h3v1H2zM3 6h1v1H3z'/><path fill='%237a6cff' d='M1 0h2v1H1zM4 0h2v1H4zM0 1h1v3H0zM6 1h1v3H6zM3 1h1v1H3zM1 4h1v1H1zM5 4h1v1H5zM2 5h1v1H2zM4 5h1v1H4zM3 6h1v1H3z'/><path fill='%23ff2e4d' d='M1 0h2v1H1zM0 1h4v3H0zM1 4h3v1H1zM2 5h2v1H2zM3 6h1v1H3z'/><path fill='%23ffd0d8' d='M1 1h1v1H1z'/></svg>");
    --glyph-skull: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 7 7' shape-rendering='crispEdges'><path fill='%23f4f1ff' d='M1 0h5v1H1zM0 1h7v1H0zM0 2h1v2H0zM3 2h1v2H3zM6 2h1v2H6zM0 4h3v1H0zM4 4h3v1H4zM1 5h5v1H1zM1 6h1v1H1zM3 6h1v1H3zM5 6h1v1H5z'/><path fill='%23ff2e4d' d='M1 2h2v2H1zM4 2h2v2H4z'/></svg>");
    --glyph-star: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 7 7' shape-rendering='crispEdges'><path fill='%23ffd23f' d='M3 0h1v1H3zM2 1h3v1H2zM0 2h7v1H0zM1 3h5v1H1zM2 4h3v1H2zM1 5h2v1H1zM4 5h2v1H4zM1 6h1v1H1zM5 6h1v1H5z'/></svg>");
    --lens-bg: var(--arcade-bg);
    --lens-fg: #ffffff;
    --lens-muted: var(--arcade-lilac);
    --lens-line: var(--arcade-bg);
    --lens-font: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
    --lens-mono: var(--lens-font);
    --heart-size: 7px 8px;
    --heart-pitch: 8px;
    --lens-up: var(--heart) center top / var(--heart-size) repeat-y;
    --lens-degraded:
      var(--heart-empty) center top / var(--heart-size) no-repeat,
      var(--heart-empty) center var(--heart-pitch) / var(--heart-size) no-repeat,
      var(--heart-half) center calc(2 * var(--heart-pitch)) / var(--heart-size)
        no-repeat,
      var(--heart) center top / var(--heart-size) repeat-y;
    --lens-down: var(--heart-empty) center top / var(--heart-size) repeat-y;
    --lens-none: var(--heart-locked) center top / var(--heart-size) repeat-y;
    --lens-up-open: var(--lens-up);
    --lens-none-open: var(--heart-locked-lit) center top / var(--heart-size)
      repeat-y;
  }

  .arcade :global([data-part='page']) {
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .arcade :global([data-part='name']) {
    padding-left: 0.3em;
    color: var(--arcade-red);
    letter-spacing: 0.3em;
  }

  .arcade :global([data-part='headline']) {
    color: var(--arcade-gold);
    font-weight: 800;
    letter-spacing: 0.02em;
    text-shadow: 3px 3px 0 #e0123a;
  }

  .arcade :global([data-part='headline']:has([data-status='operational'])) {
    color: var(--arcade-cyan);
    text-shadow: 3px 3px 0 var(--arcade-shade);
  }

  .arcade :global([data-part='headline']:has([data-status='outage'])) {
    color: #ffffff;
    text-shadow: 3px 3px 0 var(--arcade-red);
  }

  .arcade :global([data-part='headline']:has([data-status='unknown'])) {
    color: #ffffff;
    text-shadow: 3px 3px 0 var(--arcade-shade);
  }

  .arcade :global([data-part='updated']) {
    color: var(--arcade-gold);
    letter-spacing: 0.12em;
  }

  .arcade :global([data-part='monitors']) {
    position: relative;
  }

  .arcade :global([data-part='monitors'])::before,
  .arcade :global([data-part='monitor'])::after {
    position: absolute;
    right: 0;
    left: 0;
    height: 2px;
    background: repeating-linear-gradient(
      90deg,
      var(--arcade-violet) 0 4px,
      transparent 4px 8px
    );
    content: '';
  }

  .arcade :global([data-part='monitors'])::before {
    top: -1px;
  }

  .arcade :global([data-part='monitor'])::after {
    bottom: -2px;
  }

  .arcade :global([data-part='monitor-name']) {
    font-weight: 800;
    text-shadow: 2px 2px 0 var(--arcade-shade);
  }

  .arcade :global([data-part='monitor-status']) {
    --badge: var(--arcade-lilac);
    padding-inline: 0.5rem;
    background:
      linear-gradient(var(--badge), var(--badge)) center / 100% 16px no-repeat,
      linear-gradient(var(--badge), var(--badge)) center / calc(100% - 4px) 20px
        no-repeat;
    color: var(--arcade-bg);
    letter-spacing: 0.08em;
  }

  .arcade
    :global(
      [data-part='mark'][data-status='up'] + [data-part='monitor-status']
    ) {
    --badge: var(--arcade-cyan);
  }

  .arcade
    :global(
      [data-part='mark'][data-status='degraded'] + [data-part='monitor-status']
    ) {
    --badge: var(--arcade-gold);
  }

  .arcade
    :global(
      [data-part='mark'][data-status='down'] + [data-part='monitor-status']
    ) {
    --badge: var(--arcade-red);
  }

  .arcade :global([data-part='stat-label']) {
    color: var(--arcade-cyan);
    letter-spacing: 0.1em;
  }

  .arcade :global([data-part='stat-value']) {
    font-weight: 800;
    letter-spacing: 0.02em;
  }

  .arcade :global([data-part='page'] [data-part='mark'][data-status]) {
    --glyph: var(--glyph-star);
    border-radius: 0;
    background: none;
  }

  .arcade :global([data-part='mark'])::before {
    position: absolute;
    inset: -4px;
    background: var(--glyph) center / 100% 100% no-repeat;
    content: '';
  }

  .arcade :global([data-part='headline'] [data-part='mark'])::before {
    inset: -5.5px -2.5px -5.5px -8.5px;
  }

  .arcade
    :global([data-part='page'] [data-part='mark'][data-status='operational']),
  .arcade :global([data-part='page'] [data-part='mark'][data-status='up']) {
    --glyph: var(--glyph-heart);
  }

  .arcade
    :global([data-part='page'] [data-part='mark'][data-status='degraded']) {
    --glyph: var(--glyph-half);
  }

  .arcade :global([data-part='page'] [data-part='mark'][data-status='outage']),
  .arcade :global([data-part='page'] [data-part='mark'][data-status='down']) {
    --glyph: var(--glyph-skull);
  }

  .arcade :global([data-part='axis']) {
    letter-spacing: 0.08em;
  }

  .arcade :global([data-part='chart'] [data-part='day'][data-open]) {
    margin-block: 0;
    translate: 0 -4px;
    box-shadow:
      0 -1px 0 0 var(--arcade-bg),
      0 1px 0 0 var(--arcade-bg),
      -1px 0 0 0 var(--arcade-bg),
      1px 0 0 0 var(--arcade-bg),
      0 -2px 0 0 var(--arcade-gold),
      0 2px 0 0 var(--arcade-gold),
      -2px 0 0 0 var(--arcade-gold),
      2px 0 0 0 var(--arcade-gold),
      0 0 0 1px var(--arcade-gold);
  }

  .arcade :global([data-part='tooltip']) {
    gap: 2px;
    margin-bottom: 16px;
    padding: 6px 24px 8px 10px;
    border: 0;
    border-radius: 0;
    background: #0b0724;
    box-shadow:
      0 -2px 0 0 #ffffff,
      0 2px 0 0 #ffffff,
      -2px 0 0 0 #ffffff,
      2px 0 0 0 #ffffff,
      0 0 0 2px var(--arcade-violet),
      0 -4px 0 0 var(--arcade-violet),
      0 4px 0 0 var(--arcade-violet),
      -4px 0 0 0 var(--arcade-violet),
      4px 0 0 0 var(--arcade-violet);
    filter: drop-shadow(4px 4px 0 #07041a);
    color: #ffffff;
  }

  .arcade :global([data-part='tooltip'])::after {
    position: absolute;
    right: 6px;
    bottom: 10px;
    width: 14px;
    height: 8px;
    background: var(--glyph-cursor) center / 100% 100% no-repeat;
    content: '';
  }

  .arcade :global([data-part='tooltip-date']) {
    color: var(--arcade-gold);
    font-weight: 800;
  }

  .arcade :global([data-part='tooltip-zone']),
  .arcade :global([data-part='tooltip-checks']) {
    color: var(--arcade-lilac);
    font-weight: 700;
  }

  .arcade :global([data-part='tooltip-uptime']) {
    color: var(--arcade-cyan);
    font-weight: 800;
  }

  .arcade
    :global(
      [data-part='tooltip'][data-status='degraded'] [data-part='tooltip-uptime']
    ) {
    color: var(--arcade-gold);
  }

  .arcade
    :global(
      [data-part='tooltip'][data-status='down'] [data-part='tooltip-uptime']
    ) {
    color: var(--arcade-red);
  }

  .arcade
    :global(
      [data-part='tooltip'][data-status='none'] [data-part='tooltip-checks']
    ) {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .arcade
    :global(
      [data-part='tooltip'][data-status='none']
        [data-part='tooltip-checks']::before
    ) {
    width: 10px;
    height: 14px;
    background: var(--glyph-lock) center / 100% 100% no-repeat;
    content: '';
  }

  .arcade :global([data-part='tooltip-mark'][data-status]) {
    width: 14px;
    height: 14px;
    border-radius: 0;
    background: var(--glyph-heart) center / 100% 100% no-repeat;
  }

  .arcade :global([data-part='tooltip-mark'][data-status='degraded']) {
    background-image: var(--glyph-half);
  }

  .arcade :global([data-part='tooltip-mark'][data-status='down']) {
    background-image: var(--glyph-skull);
  }

  @media (40rem <= width < 66rem) {
    .arcade {
      --heart: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 -1 5 6' shape-rendering='crispEdges'><path fill='%23ff2e4d' d='M1 0h1v1H1zM3 0h1v1H3zM0 1h5v2H0zM1 3h3v1H1zM2 4h1v1H2z'/><path fill='%23ffd0d8' d='M1 1h1v1H1z'/></svg>");
      --heart-half: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 -1 5 6' shape-rendering='crispEdges'><path fill='%230b0724' d='M1 0h1v1H1zM3 0h1v1H3zM0 1h5v2H0zM1 3h3v1H1zM2 4h1v1H2z'/><path fill='%237a6cff' d='M3 0h1v1H3zM4 1h1v2H4zM3 3h1v1H3z'/><path fill='%23ff2e4d' d='M1 0h1v1H1zM0 1h3v2H0zM1 3h2v1H1zM2 4h1v1H2z'/><path fill='%23ffd0d8' d='M1 1h1v1H1z'/></svg>");
      --heart-empty: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 -1 5 6' shape-rendering='crispEdges'><path fill='%230b0724' d='M1 0h1v1H1zM3 0h1v1H3zM0 1h5v2H0zM1 3h3v1H1zM2 4h1v1H2z'/><path fill='%237a6cff' d='M1 0h1v1H1zM3 0h1v1H3zM0 1h1v2H0zM2 1h1v1H2zM4 1h1v2H4zM1 3h1v1H1zM3 3h1v1H3zM2 4h1v1H2z'/></svg>");
      --heart-locked: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 -1 5 6' shape-rendering='crispEdges'><path fill='%232d2768' d='M1 0h1v1H1zM3 0h1v1H3zM0 1h5v2H0zM1 3h3v1H1zM2 4h1v1H2z'/></svg>");
      --heart-locked-lit: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 -1 5 6' shape-rendering='crispEdges'><path fill='%234a40a8' d='M1 0h1v1H1zM3 0h1v1H3zM0 1h5v2H0zM1 3h3v1H1zM2 4h1v1H2z'/></svg>");
      --heart-size: 5px 6px;
      --heart-pitch: 6px;
    }
  }

  @media (width < 40rem) {
    .arcade :global([data-part='headline']) {
      white-space: pre-line;
    }
  }

  @media (prefers-reduced-motion: no-preference) {
    .arcade :global([data-part='updated']) {
      animation: blink 1.6s steps(1) infinite;
    }

    .arcade :global([data-part='chart'] [data-part='day'][data-open]) {
      animation: hop 180ms steps(1);
    }

    .arcade :global([data-part='tooltip']) {
      transform-origin: bottom;
      animation: open 120ms steps(1);
    }

    .arcade :global([data-part='tooltip'] > p) {
      animation: type 120ms steps(1);
    }

    .arcade :global([data-part='tooltip'])::after {
      animation:
        type 120ms steps(1),
        next 1s 120ms steps(1) infinite;
    }
  }

  @keyframes blink {
    50% {
      color: #ffffff;
    }
  }

  @keyframes hop {
    0% {
      translate: 0 -2px;
    }

    25% {
      translate: 0 -5px;
    }

    50% {
      translate: 0 -6px;
    }

    75% {
      translate: 0 -5px;
    }
  }

  @keyframes open {
    0% {
      scale: 1 0.25;
    }

    50% {
      scale: 1 0.6;
    }
  }

  @keyframes type {
    0% {
      opacity: 0;
    }
  }

  @keyframes next {
    50% {
      opacity: 0;
    }
  }
</style>
