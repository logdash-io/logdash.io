<script lang="ts">
  import LensPage from './LensPage.svelte';
  import type { LensLabels, SkinProps } from './skin-data';

  const { page }: SkinProps = $props();

  const LABELS: LensLabels = {
    page: {
      operational: 'All tasks running',
      degraded: 'Not responding',
      outage: 'Fatal exception',
      unknown: 'Please wait...',
    },
    monitor: {
      up: 'Running',
      degraded: 'Not responding',
      down: 'Crashed',
      unknown: 'Unknown',
    },
    uptime: {
      '24h': 'Uptime (24 h):',
      '7d': 'Uptime (7 d):',
      '30d': 'Uptime (30 d):',
      '90d': 'Uptime (90 d):',
    },
    updated: 'Press any key to continue',
    since: (days) => `${days} days ago`,
    today: 'Today',
    day: {
      uptime: (percent) => `Uptime: ${percent}`,
      checks: (count, latencyMs) =>
        latencyMs === null
          ? `Checks: ${count}`
          : `Checks: ${count} (avg. ${latencyMs} ms)`,
      empty: 'No data available',
    },
  };
</script>

<div class="desktop95 h-full">
  <LensPage {page} labels={LABELS} />
</div>

<style>
  .desktop95 {
    --face: #c0c0c0;
    --dialog-w: 240px;
    --field-w: 80px;
    --lens-bg: #008080;
    --lens-fg: #000000;
    --lens-muted: #3c3c3c;
    --lens-line: #808080;
    --lens-font: Tahoma, Geneva, Arial, sans-serif;
    --lens-mono: var(--lens-font);
  }

  @media (width >= 40rem) {
    .desktop95 {
      --dialog-w: 432px;
      --field-w: 96px;
    }
  }

  .desktop95 :global([data-part='header']) {
    position: relative;
    isolation: isolate;
  }

  .desktop95 :global([data-part='header']::before) {
    content: '';
    position: absolute;
    z-index: -1;
    top: -8px;
    bottom: -22px;
    left: calc(50% - var(--dialog-w) / 2);
    width: var(--dialog-w);
    background: var(--face);
    box-shadow:
      inset -1px -1px #000000,
      inset 1px 1px #dfdfdf,
      inset -2px -2px #808080,
      inset 2px 2px #ffffff;
  }

  .desktop95 :global([data-part='header'] [data-part='name']) {
    color: #ffffff;
    font-weight: 700;
  }

  .desktop95 :global([data-part='name']::before) {
    content: '';
    position: absolute;
    z-index: -1;
    top: -4px;
    left: calc(50% - var(--dialog-w) / 2 + 4px);
    width: calc(var(--dialog-w) - 8px);
    height: 32px;
    background:
      url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' shape-rendering='crispEdges'%3E%3Cpath fill='%23000' d='M1 1h18v14H1zM8 15h4v1H8zM4 16h12v3H4z'/%3E%3Cpath fill='%23fff' d='M2 2h16v12H2z'/%3E%3Cpath fill='%23808080' d='M3 3h15v11H3z'/%3E%3Cpath fill='%23c0c0c0' d='M3 3h14v10H3zM5 16h10v2H5z'/%3E%3Cpath fill='%23000' d='M4 4h12v8H4z'/%3E%3Cpath fill='%2300ff00' d='M5 8h3v1H5zM8 6h1v2H8zM9 5h1v6H9zM10 9h1v1h-1zM11 8h4v1h-4z'/%3E%3C/svg%3E")
        6px center / 20px 20px no-repeat,
      linear-gradient(90deg, #000080, #1084d0);
  }

  .desktop95 :global([data-part='name']::after) {
    content: '';
    position: absolute;
    top: 2px;
    right: calc(50% - var(--dialog-w) / 2 + 10px);
    width: 68px;
    height: 20px;
    background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='68' height='20' shape-rendering='crispEdges'%3E%3Cdefs%3E%3Cg id='b'%3E%3Cpath fill='%23000' d='M0 0h22v20H0z'/%3E%3Cpath fill='%23fff' d='M0 0h21v19H0z'/%3E%3Cpath fill='%23808080' d='M1 1h20v18H1z'/%3E%3Cpath fill='%23dfdfdf' d='M1 1h19v17H1z'/%3E%3Cpath fill='%23c0c0c0' d='M2 2h18v16H2z'/%3E%3C/g%3E%3C/defs%3E%3Cuse href='%23b'/%3E%3Cuse href='%23b' x='22'/%3E%3Cuse href='%23b' x='46'/%3E%3Cpath d='M7 13h8v2H7zM28 4h10v2H28zM28 6h1v8h-1zM37 6h1v8h-1zM28 13h10v1H28z'/%3E%3Cpath transform='translate(46)' d='M6 5h2v1H6zM14 5h2v1h-2zM7 6h2v1H7zM13 6h2v1h-2zM8 7h2v1H8zM12 7h2v1h-2zM9 8h2v1H9zM11 8h2v1h-2zM10 9h2v1h-2zM11 10h2v1h-2zM9 10h2v1H9zM12 11h2v1h-2zM8 11h2v1H8zM13 12h2v1h-2zM7 12h2v1H7zM14 13h2v1h-2zM6 13h2v1H6z'/%3E%3C/svg%3E")
      center / 68px 20px no-repeat;
  }

  .desktop95 :global([data-part='headline']) {
    font-weight: 700;
  }

  .desktop95 :global([data-part='headline'] [data-part='mark']::before) {
    content: '';
    position: absolute;
    top: -9px;
    left: -12px;
    width: 28px;
    height: 28px;
    background: var(--icon) center / 28px 28px no-repeat;
  }

  .desktop95 :global([data-part='headline'] [data-part='mark']) {
    background: none;
    --icon: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28'%3E%3Cpath fill='%23808080' d='M8 4h16v3h-2v3l-5 5v1l5 5v3h2v3H8v-3h2v-3l5-5v-1l-5-5V7H8z'/%3E%3Cpath d='M6 2h16v3H6zM6 23h16v3H6z'/%3E%3Cpath fill='%23fff' stroke='%23000' d='M8.5 5.5h11v3l-4.5 5v1l4.5 5v3h-11v-3l4.5-5v-1l-4.5-5z'/%3E%3Cpath fill='%23000080' d='M10.5 9h7L14 13zM13.5 13h1v7h-1zM10 22.5h8V21l-4-3-4 3z'/%3E%3C/svg%3E");
  }

  .desktop95
    :global(
      [data-part='headline'] [data-part='mark'][data-status='operational']
    ) {
    --icon: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28'%3E%3Ccircle cx='15' cy='15' r='12' fill='%23808080'/%3E%3Ccircle cx='13' cy='13' r='11.5' fill='%23fff' stroke='%23000'/%3E%3Cpath fill='%23000080' d='M11 5h4v4h-4zM9 11h6v9h2v2H9v-2h2v-7H9z'/%3E%3C/svg%3E");
  }

  .desktop95
    :global([data-part='headline'] [data-part='mark'][data-status='degraded']) {
    --icon: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28'%3E%3Cpath fill='%23808080' d='M15 4l12.5 23h-25z'/%3E%3Cpath fill='%23ff0' stroke='%23000' stroke-linejoin='round' d='M13 1.5l12.5 23H.5z'/%3E%3Cpath d='M11 9h4v8h-4zM11 19h4v3h-4z'/%3E%3C/svg%3E");
  }

  .desktop95
    :global([data-part='headline'] [data-part='mark'][data-status='outage']) {
    --icon: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28'%3E%3Ccircle cx='15' cy='15' r='12' fill='%23808080'/%3E%3Ccircle cx='13' cy='13' r='11.5' fill='%23f00' stroke='%23800000'/%3E%3Cpath stroke='%23fff' stroke-width='3' d='M8.5 8.5l9 9M17.5 8.5l-9 9'/%3E%3C/svg%3E");
  }

  .desktop95 :global([data-part='monitors']) {
    position: relative;
    isolation: isolate;
    border-color: #dfdfdf;
  }

  .desktop95 :global([data-part='monitors']::before) {
    content: '';
    position: absolute;
    z-index: -1;
    top: -1px;
    right: -12px;
    bottom: 0;
    left: -12px;
    background: var(--face);
    box-shadow:
      inset -1px -1px #000000,
      inset 1px 1px #dfdfdf,
      inset -2px -2px #808080,
      inset 2px 2px #ffffff;
  }

  .desktop95 :global([data-part='monitor']) {
    border-color: #808080;
    box-shadow: 0 1px #ffffff;
  }

  .desktop95 :global([data-part='monitor-name']) {
    font-weight: 700;
  }

  .desktop95
    :global(
      :is(
        [data-part='monitor-head'] [data-part='mark'],
        [data-part='tooltip-mark']
      )
    ) {
    --led: #808080;
    --led-rim: #404040;
    background: none;
  }

  .desktop95
    :global(
      :is(
          [data-part='monitor-head'] [data-part='mark'],
          [data-part='tooltip-mark']
        )::before
    ) {
    content: '';
    position: absolute;
    inset: -2px;
    border-radius: 50%;
    background: radial-gradient(
      circle at 35% 35%,
      #ffffff 0 1px,
      var(--led) 2px
    );
    box-shadow:
      inset 0 0 0 1px var(--led-rim),
      -1px -1px #808080,
      1px 1px #ffffff;
  }

  .desktop95
    :global(
      :is(
          [data-part='monitor-head'] [data-part='mark'],
          [data-part='tooltip-mark']
        )[data-status='up']
    ) {
    --led: #00ff00;
    --led-rim: #008000;
  }

  .desktop95
    :global(
      :is(
          [data-part='monitor-head'] [data-part='mark'],
          [data-part='tooltip-mark']
        )[data-status='degraded']
    ) {
    --led: #ffff00;
    --led-rim: #808000;
  }

  .desktop95
    :global(
      :is(
          [data-part='monitor-head'] [data-part='mark'],
          [data-part='tooltip-mark']
        )[data-status='down']
    ) {
    --led: #ff0000;
    --led-rim: #800000;
  }

  .desktop95 :global([data-part='monitor-status']) {
    padding-inline: 8px;
    color: #000000;
    box-shadow:
      inset 1px 1px #808080,
      inset -1px -1px #ffffff;
  }

  .desktop95 :global([data-part='stat-label']::first-letter) {
    text-decoration: underline;
  }

  .desktop95 :global([data-part='stat-value']) {
    position: relative;
    font-weight: 400;
  }

  .desktop95 :global([data-part='stat-value']::before) {
    content: '';
    position: absolute;
    z-index: -1;
    top: 0;
    bottom: 0;
    left: calc(50% - var(--field-w) / 2);
    width: var(--field-w);
    background: #ffffff;
    box-shadow:
      inset 1px 1px #808080,
      inset -1px -1px #ffffff,
      inset 2px 2px #000000,
      inset -2px -2px #dfdfdf;
  }

  .desktop95 :global([data-part='chart']::before) {
    content: '';
    position: absolute;
    inset: 0 -4px;
    box-shadow:
      inset 1px 1px #808080,
      inset -1px -1px #ffffff,
      inset 2px 2px #000000,
      inset -2px -2px #dfdfdf;
  }

  .desktop95 :global([data-part='chart'] [data-part='day'][data-status]) {
    border-radius: 0;
    background: linear-gradient(var(--block), var(--block)) center / 100%
      calc(100% - 8px) no-repeat;
  }

  .desktop95 :global([data-part='day'][data-status='up']) {
    --block: #000080;
  }

  .desktop95 :global([data-part='day'][data-status='degraded']) {
    --block: #ffff00;
  }

  .desktop95 :global([data-part='day'][data-status='down']) {
    --block: #ff0000;
  }

  .desktop95 :global([data-part='day'][data-status='none']) {
    --block: transparent;
  }

  .desktop95 :global([data-part='day'][data-open]) {
    position: relative;
    margin-block: 0;
  }

  .desktop95 :global([data-part='day'][data-open]::before) {
    --dots: #000000 0 1px, transparent 0 2px;
    content: '';
    position: absolute;
    inset: 4px 0;
    background:
      repeating-linear-gradient(90deg, var(--dots)) top / 100% 1px no-repeat,
      repeating-linear-gradient(90deg, var(--dots)) bottom / 100% 1px no-repeat,
      repeating-linear-gradient(var(--dots)) left / 1px 100% no-repeat,
      repeating-linear-gradient(var(--dots)) right / 1px 100% no-repeat;
  }

  .desktop95 :global([data-part='day'][data-status='up'][data-open]) {
    --block: #ffff7f;
  }

  .desktop95 :global([data-part='day'][data-status='degraded'][data-open]) {
    --block: #0000ff;
  }

  .desktop95 :global([data-part='day'][data-status='down'][data-open]) {
    --block: #00ffff;
  }

  .desktop95 :global([data-part='tooltip']) {
    gap: 1px;
    padding: 3px 6px 4px;
    border-color: transparent;
    border-radius: 0;
    background: none;
    color: #000000;
    font-size: 11px;
    line-height: 14px;
    box-shadow: none;
  }

  .desktop95 :global([data-part='tooltip']::before),
  .desktop95 :global([data-part='tooltip']::after) {
    content: '';
    position: absolute;
    z-index: -1;
    inset: -1px;
  }

  .desktop95 :global([data-part='tooltip']::before) {
    inset: 1px -3px -3px 1px;
    background: repeating-conic-gradient(#000000 0 25%, transparent 0 50%) 0 0 /
      2px 2px;
  }

  .desktop95 :global([data-part='tooltip']::after) {
    border: 1px solid #000000;
    background: #ffffe1;
  }

  .desktop95 :global([data-part='tooltip'] p) {
    font-size: inherit;
    line-height: inherit;
  }

  .desktop95 :global([data-part='tooltip-date']) {
    font-weight: 700;
  }

  .desktop95 :global([data-part='tooltip-zone']) {
    color: #000000;
    font-family: inherit;
    font-size: inherit;
    font-weight: 400;
  }

  .desktop95 :global([data-part='tooltip-uptime']) {
    gap: 6px;
  }

  .desktop95 :global([data-part='tooltip-mark']) {
    margin-left: 2px;
  }

  .desktop95 :global([data-part='tooltip'] [data-part='tooltip-mark']::before) {
    inset: -1px;
  }

  .desktop95 :global([data-part='tooltip-checks']) {
    color: #000000;
  }

  @media (width < 40rem) {
    .desktop95 :global([data-part='headline']) {
      padding-right: 63px;
      padding-left: 79px;
      text-align: left;
    }
  }
</style>
