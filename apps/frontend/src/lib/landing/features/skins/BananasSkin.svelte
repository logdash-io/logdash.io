<script lang="ts">
  import LensPage from './LensPage.svelte';
  import type { DayStatus, LensLabels, SkinProps } from './skin-data';

  type Shape = {
    viewBox: string;
    body: string;
    shade: string;
    shine: string;
    stem: string;
    tip: [number, number, number];
    spots: [number, number, number][];
  };

  type Paint = {
    fill: string;
    shade: string;
    shine: string;
    line: string;
    tip: string;
    stem: string;
    spots?: string;
  };

  const { page }: SkinProps = $props();

  const LABELS: LensLabels = {
    page: {
      operational: 'All a-peeling',
      degraded: 'A bit bananas',
      outage: 'Gone bananas',
      unknown: 'Still ripening',
    },
    monitor: {
      up: 'Ripe',
      degraded: 'Bruised',
      down: 'Banana split',
      unknown: 'Still green',
    },
    uptime: {
      '24h': '24 h ripeness',
      '7d': '7 d ripeness',
      '30d': '30 d ripeness',
      '90d': '90 d ripeness',
    },
    updated: 'Freshly picked every minute',
    since: (days) => `${days} bananas ago`,
    today: 'Today',
    day: {
      uptime: (percent) => `${percent} ripe`,
      checks: (count, latencyMs) =>
        latencyMs === null
          ? `${count} bananas inspected`
          : `${count} bananas · peeled in ${latencyMs} ms`,
      empty: 'Not picked yet',
    },
  };

  const DAY: Shape = {
    viewBox: '0 0 24 96',
    body: 'M16.6 4.2C15.6 5.4 12.3 8.8 10.5 11.3C8.8 13.8 7.3 16.5 6 19.2C4.7 22 3.6 24.8 2.7 27.7C1.9 30.6 1.3 33.5 1 36.5C0.6 39.5 0.5 42.6 0.7 45.6C0.8 48.6 1.2 51.7 1.8 54.7C2.4 57.7 3.3 60.7 4.3 63.7C5.4 66.7 6.6 69.6 8.1 72.5C9.6 75.4 11.6 80 13.2 81C14.8 82.1 17.4 80.8 17.8 79C18.2 77.1 16.3 72.8 15.7 69.8C15.1 66.9 14.5 64 14.2 61.2C13.8 58.5 13.5 55.7 13.3 53.1C13.1 50.4 13.1 47.8 13.1 45.3C13.1 42.7 13.1 40.2 13.3 37.7C13.5 35.1 13.7 32.6 14 30.1C14.4 27.5 14.8 25 15.3 22.4C15.8 19.8 16.4 17.1 17.1 14.4C17.8 11.6 19 7.2 19.4 5.8Z',
    shade:
      'M18.4 9.8C18 11 17 14.8 16.4 17.2C15.8 19.6 15.3 22 14.9 24.3C14.5 26.7 14.2 29 13.9 31.2C13.6 33.5 13.4 35.8 13.3 38C13.1 40.3 13.1 42.6 13.1 44.9C13 47.2 13.1 49.5 13.2 51.9C13.4 54.3 13.6 56.7 13.9 59.2C14.2 61.6 14.6 64.2 15.1 66.8C15.5 69.4 16.9 73.2 16.8 74.7C16.7 76.2 15.2 76.9 14.4 75.8C13.5 74.6 12.5 70.5 11.7 67.8C10.9 65.2 10.3 62.6 9.8 60.1C9.2 57.5 8.8 55 8.6 52.5C8.3 50 8.1 47.5 8.1 45C8.1 42.5 8.1 40.1 8.3 37.6C8.5 35.2 8.9 32.8 9.3 30.3C9.7 27.9 10.3 25.5 11 23.1C11.6 20.7 12.4 18.3 13.4 15.9C14.3 13.5 16 10 16.5 8.8Z',
    shine:
      'M9.2 18.5C8.9 19.2 8 21.4 7.5 22.9C6.9 24.5 6.5 26 6.1 27.5C5.7 29 5.3 30.6 5 32.1C4.7 33.7 4.5 35.3 4.4 36.8C4.2 38.4 4.1 40 4.1 41.6C4 43.2 4 44.8 4.1 46.4C4.2 48 4.3 49.6 4.5 51.2C4.7 52.8 5 54.4 5.3 56C5.6 57.6 6.2 60 6.4 60.8',
    stem: 'M14.9 78.6Q15.5 88 18.5 93.5',
    tip: [18, 5, 2.1],
    spots: [
      [10.1, 18.8, 2.2],
      [11.4, 28.6, 1.6],
      [5, 37.2, 2.6],
      [9.6, 46.6, 2.1],
      [4.2, 54.2, 1.6],
      [7.6, 62.4, 2.4],
      [12.1, 70.4, 1.6],
    ],
  };

  const MARK: Shape = {
    viewBox: '0 0 32 32',
    body: 'M1.5 20C1.9 20.8 2.9 23.6 4 25C5.2 26.4 6.7 27.6 8.3 28.3C9.9 29 12 29.3 13.7 29.1C15.5 29 17.5 28.2 19 27.2C20.5 26.2 21.8 24.7 22.9 23.2C24 21.7 24.8 19.9 25.5 17.9C26.1 15.9 27.3 12.8 26.9 11.4C26.5 10 24.5 9.2 23.1 9.6C21.7 9.9 20 12.4 18.7 13.5C17.4 14.5 16.2 15.3 15.3 15.9C14.3 16.5 13.5 16.8 13 17C12.4 17.3 12.2 17.3 11.8 17.5C11.4 17.7 11.2 18 10.6 18.1C10 18.3 9.2 18.5 8 18.5C6.8 18.5 4.2 18.1 3.5 18Z',
    shade:
      'M2.2 22C2.6 22.7 3.8 24.9 5 26C6.1 27.1 7.5 28.1 9 28.6C10.5 29.1 12.4 29.3 14 29.1C15.6 28.9 17.4 28.2 18.8 27.3C20.2 26.5 21.4 25.2 22.4 23.9C23.4 22.6 24.2 21 24.9 19.3C25.6 17.7 26.7 15 26.6 13.9C26.5 12.8 25.3 12.2 24.5 12.7C23.8 13.3 22.9 16 22.1 17.3C21.2 18.6 20.3 19.8 19.4 20.8C18.4 21.8 17.4 22.6 16.4 23.2C15.4 23.8 14.2 24.3 13.1 24.5C12 24.6 10.9 24.6 9.8 24.4C8.7 24.1 7.6 23.6 6.5 23C5.4 22.4 3.9 20.9 3.4 20.5Z',
    shine:
      'M8.2 20.7C8.5 20.7 9.3 20.9 9.8 20.9C10.3 20.9 10.8 20.9 11.2 20.9C11.6 20.8 12 20.8 12.4 20.7C12.8 20.6 13.2 20.4 13.7 20.3C14.1 20.1 14.5 19.9 15 19.6C15.5 19.3 16 19 16.5 18.6C17 18.2 17.9 17.5 18.1 17.2',
    stem: 'M24.3 11.8Q25.6 8 27.6 5',
    tip: [2.5, 19, 1.7],
    spots: [
      [9.9, 22.8, 1.5],
      [15.1, 24.8, 1.8],
      [18.2, 19.3, 1.4],
    ],
  };

  const PAINT: Record<DayStatus, Paint> = {
    up: {
      fill: '#ffd83d',
      shade: '#f2b705',
      shine: '#fff4b8',
      line: '#5a3a00',
      tip: '#3d2800',
      stem: '#8a9a2c',
    },
    degraded: {
      fill: '#eaa93a',
      shade: '#c9820f',
      shine: '#f9d58a',
      line: '#4a2c00',
      tip: '#3d2800',
      stem: '#6f6424',
      spots: '#6b3606',
    },
    down: {
      fill: '#3b2716',
      shade: '#24170b',
      shine: '#5a4029',
      line: '#140b03',
      tip: '#0a0602',
      stem: '#3b3419',
      spots: '#5c3d1e',
    },
    none: {
      fill: '#b5dc5a',
      shade: '#8cbc34',
      shine: '#e2f5ae',
      line: '#3e5c10',
      tip: '#4b5e1c',
      stem: '#6d8f25',
    },
  };

  const SPROUT = 'translate(6.5 36) scale(0.62)';

  const STATUSES: DayStatus[] = ['up', 'degraded', 'down', 'none'];

  const STYLE = STATUSES.flatMap((status) => [
    `--day-${status}: ${banana(DAY, PAINT[status], status === 'none' ? SPROUT : '')}`,
    `--mark-${status}: ${banana(MARK, PAINT[status])}`,
  ]).join('; ');

  function banana(shape: Shape, paint: Paint, transform = ''): string {
    const [x, y, r] = shape.tip;
    const spots = paint.spots
      ? `<g fill="${paint.spots}">${shape.spots.map(([cx, cy, cr]) => `<circle cx="${cx}" cy="${cy}" r="${cr}"/>`).join('')}</g>`
      : '';
    const svg = [
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${shape.viewBox}" preserveAspectRatio="none">`,
      `<defs><path id="b" d="${shape.body}"/></defs>`,
      `<g transform="${transform}">`,
      `<path d="${shape.stem}" fill="none" stroke="${paint.line}" stroke-width="4.6" stroke-linecap="round"/>`,
      `<path d="${shape.stem}" fill="none" stroke="${paint.stem}" stroke-width="2.2" stroke-linecap="round"/>`,
      `<use href="#b" fill="${paint.fill}"/>`,
      `<path d="${shape.shade}" fill="${paint.shade}"/>`,
      `<path d="${shape.shine}" fill="none" stroke="${paint.shine}" stroke-width="1.4" stroke-linecap="round"/>`,
      spots,
      `<use href="#b" fill="none" stroke="${paint.line}" stroke-width="1.4" stroke-linejoin="round"/>`,
      `<circle cx="${x}" cy="${y}" r="${r}" fill="${paint.tip}"/>`,
      '</g></svg>',
    ].join('');

    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }
</script>

<div class="bananas h-full" style={STYLE}>
  <LensPage {page} labels={LABELS} />
</div>

<style>
  .bananas {
    --lens-bg: #ffe45c;
    --lens-fg: #3d2800;
    --lens-muted: #6b4a00;
    --lens-line: #b0800f;
    --lens-font:
      ui-rounded, 'SF Pro Rounded', 'Nunito', 'Arial Rounded MT Bold',
      'Trebuchet MS', sans-serif;
    --lens-mono: var(--lens-font);
    --lens-ok: #2f6b1f;
    --lens-degraded: #8a4b0f;
    --lens-down: #2a1a0a;
  }

  .bananas :global([data-part='page']) {
    font-synthesis: none;
  }

  .bananas :global([data-part='name']) {
    position: relative;
    isolation: isolate;
    padding-inline: 12px;
    color: #fffbe8;
    font-weight: 800;
    letter-spacing: 0.02em;
  }

  .bananas :global([data-part='name']::before) {
    content: '';
    position: absolute;
    inset: 2px 0;
    z-index: -1;
    border-radius: 999px;
    background: #1d4fa3;
  }

  .bananas :global([data-part='headline']) {
    font-weight: 800;
    letter-spacing: -0.02em;
    text-shadow: 0 3px 0 #f2b705;
  }

  .bananas :global([data-part='updated']),
  .bananas :global([data-part='stat-label']),
  .bananas :global([data-part='axis']) {
    font-weight: 700;
  }

  .bananas :global([data-part='monitor-name']),
  .bananas :global([data-part='monitor-status']),
  .bananas :global([data-part='stat-value']) {
    font-weight: 800;
  }

  .bananas :global([data-part='monitors']),
  .bananas :global([data-part='monitor']) {
    border-style: dashed;
  }

  .bananas
    :global(
      [data-part='mark'][data-status='up'] + [data-part='monitor-status']
    ) {
    color: var(--lens-ok);
  }

  .bananas
    :global(
      [data-part='mark'][data-status='degraded'] + [data-part='monitor-status']
    ) {
    color: var(--lens-degraded);
  }

  .bananas
    :global(
      [data-part='mark'][data-status='down'] + [data-part='monitor-status']
    ) {
    color: var(--lens-down);
  }

  .bananas :global([data-part='page'] [data-part='mark'][data-status]) {
    background: none;
  }

  .bananas :global([data-part='mark']::before) {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 18px;
    height: 18px;
    translate: -50% -50%;
    background: var(--mark-none) center / 100% 100% no-repeat;
  }

  .bananas :global([data-part='headline'] [data-part='mark']::before) {
    width: 32px;
    height: 32px;
    translate: calc(-50% - 5px) -50%;
  }

  .bananas :global([data-part='mark'][data-status='operational']::before),
  .bananas :global([data-part='mark'][data-status='up']::before) {
    background-image: var(--mark-up);
  }

  .bananas :global([data-part='mark'][data-status='degraded']::before) {
    background-image: var(--mark-degraded);
  }

  .bananas :global([data-part='mark'][data-status='outage']::before),
  .bananas :global([data-part='mark'][data-status='down']::before) {
    background-image: var(--mark-down);
  }

  .bananas :global([data-part='chart']) {
    border-radius: 8px;
    background: #fff6d5;
    box-shadow: 0 0 0 5px #fff6d5;
  }

  .bananas :global([data-part='chart'] [data-part='day'][data-status]) {
    position: relative;
    border-radius: 0;
    background: none;
  }

  .bananas :global([data-part='day']::before) {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: 50%;
    width: min(12px, 100% + 3.5px);
    translate: -50% 0;
    background: var(--day-up) center / 100% 100% no-repeat;
  }

  .bananas :global([data-part='day'][data-status='degraded']::before) {
    background-image: var(--day-degraded);
  }

  .bananas :global([data-part='day'][data-status='down']::before) {
    background-image: var(--day-down);
  }

  .bananas :global([data-part='day'][data-status='none']::before) {
    background-image: var(--day-none);
  }

  .bananas
    :global([data-part='chart'] [data-part='day'][data-status][data-open]) {
    z-index: 1;
    margin-block: 0;
    background: none;
  }

  .bananas :global([data-part='day'][data-open]::before) {
    translate: -50% -3px;
    rotate: -10deg;
    scale: 1.25;
    filter: drop-shadow(0 2px 0 #e0b43a);
  }

  .bananas :global([data-part='day'][data-status='down'][data-open]::before) {
    rotate: 10deg;
  }

  .bananas :global([data-part='tooltip']) {
    gap: 2px;
    margin-bottom: 16px;
    padding: 10px 16px;
    border: 2px solid #3d2800;
    border-radius: 16px;
    outline: 1.5px dashed var(--lens-line);
    outline-offset: -7px;
    background: #fffbe8;
    color: #3d2800;
    box-shadow:
      0 3px 0 #3d2800,
      0 12px 20px -8px rgba(61, 40, 0, 0.5);
    rotate: -2deg;
    transform-origin: var(--at-wide) 100%;
  }

  .bananas :global([data-part='tooltip']::after) {
    content: '';
    position: absolute;
    top: 100%;
    left: clamp(18px, var(--at-wide), calc(100% - 18px));
    width: 12px;
    height: 12px;
    translate: -50% -50%;
    rotate: 45deg;
    border-right: 2px solid #3d2800;
    border-bottom: 2px solid #3d2800;
    border-bottom-right-radius: 3px;
    background: #fffbe8;
    box-shadow: 2px 2px 0 #3d2800;
  }

  .bananas :global([data-part='tooltip-date']) {
    font-weight: 800;
  }

  .bananas :global([data-part='tooltip-zone']),
  .bananas :global([data-part='tooltip-checks']) {
    color: var(--lens-muted);
    font-weight: 700;
  }

  .bananas :global([data-part='tooltip-uptime']) {
    gap: 6px;
    font-weight: 800;
  }

  .bananas :global([data-part='tooltip-mark'][data-status]) {
    width: 18px;
    height: 18px;
    border-radius: 0;
    background: var(--mark-none) center / 100% 100% no-repeat;
  }

  .bananas :global([data-part='tooltip-mark'][data-status='up']) {
    background-image: var(--mark-up);
  }

  .bananas :global([data-part='tooltip-mark'][data-status='degraded']) {
    background-image: var(--mark-degraded);
  }

  .bananas :global([data-part='tooltip-mark'][data-status='down']) {
    background-image: var(--mark-down);
  }

  .bananas
    :global(
      [data-part='tooltip'][data-status='none'] [data-part='tooltip-checks']
    ) {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .bananas
    :global(
      [data-part='tooltip'][data-status='none']
        [data-part='tooltip-checks']::before
    ) {
    content: '';
    width: 18px;
    height: 18px;
    background: var(--mark-none) center / 100% 100% no-repeat;
  }

  @media (width < 40rem) {
    .bananas :global([data-part='tooltip']) {
      transform-origin: var(--at-narrow) 100%;
    }

    .bananas :global([data-part='tooltip']::after) {
      left: clamp(18px, var(--at-narrow), calc(100% - 18px));
    }
  }

  @media (prefers-reduced-motion: no-preference) {
    .bananas :global([data-part='day']::before) {
      transition-property: translate, rotate, scale;
      transition-duration: 140ms;
      transition-timing-function: ease-out;
    }

    .bananas :global([data-part='day'][data-open]::before) {
      transition-duration: 200ms;
      transition-timing-function: cubic-bezier(0.34, 1.8, 0.64, 1);
    }

    .bananas :global([data-part='tooltip']) {
      animation: bananas-slap 180ms cubic-bezier(0.34, 1.56, 0.64, 1);
    }
  }

  @keyframes -global-bananas-slap {
    from {
      opacity: 0;
      scale: 0.7;
      rotate: -9deg;
    }
  }
</style>
