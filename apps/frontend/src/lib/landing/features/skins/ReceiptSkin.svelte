<script lang="ts">
  import LensPage from './LensPage.svelte';
  import type { LensLabels, SkinProps } from './skin-data';

  const { page }: SkinProps = $props();

  const LABELS: LensLabels = {
    page: {
      operational: 'Paid in full',
      degraded: 'Shortchanged',
      outage: 'Out of order',
      unknown: 'Price check',
    },
    monitor: {
      up: 'Served',
      degraded: 'Served cold',
      down: 'Sold out',
      unknown: 'Pending',
    },
    uptime: {
      '24h': '24h subttl',
      '7d': '7d subttl',
      '30d': '30d subttl',
      '90d': '90d total',
    },
    updated: 'Thank you for your uptime',
    since: (days) => `${days} days ago`,
    today: 'Today',
    day: {
      uptime: (percent) => `${percent} uptime`,
      checks: (count, latencyMs) =>
        latencyMs === null
          ? `${count} checks`
          : `${count} checks @ ${latencyMs} ms`,
      empty: '*** No sale ***',
    },
  };
</script>

<div class="receipt h-full">
  <LensPage {page} labels={LABELS}>
    <svg
      class="stamp absolute"
      width="172"
      height="58"
      viewBox="0 0 172 58"
      aria-hidden="true"
    >
      <filter id="receipt-stamp-ink" x="-4%" y="-8%" width="108%" height="116%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.9"
          numOctaves="2"
          seed="7"
          result="grain"
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="grain"
          scale="1.4"
          xChannelSelector="R"
          yChannelSelector="G"
          result="rough"
        />
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.45"
          numOctaves="3"
          seed="3"
          result="blots"
        />
        <feColorMatrix
          in="blots"
          type="matrix"
          values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -20 0 0 0 13.4"
          result="ink"
        />
        <feComposite in="rough" in2="ink" operator="in" />
      </filter>

      <g filter="url(#receipt-stamp-ink)" fill="none" stroke="#c8102e">
        <rect x="2" y="2" width="168" height="54" rx="4" stroke-width="3" />
        <rect x="6.5" y="6.5" width="159" height="45" rx="1.5" />
        <g fill="#c8102e" stroke="none" text-anchor="middle">
          <text x="86" y="27" font-size="18">NO REFUNDS</text>
          <text x="86" y="47" font-size="13">ON DOWNTIME</text>
        </g>
      </g>
    </svg>
  </LensPage>
</div>

<style>
  .receipt {
    --lens-bg: #fbfaf6;
    --lens-fg: #1b1a17;
    --lens-muted: #6b675f;
    --lens-line: #1b1a17;
    --lens-font:
      ui-monospace, 'SF Mono', Menlo, Consolas, 'Courier New', monospace;
    --lens-mono: var(--lens-font);
    --lens-up: linear-gradient(#1b1a17 0 0) 50% 0 / 2px 100% no-repeat;
    --lens-degraded: linear-gradient(#1b1a17 0 0) 50% 0 / 4px 100% no-repeat;
    --lens-down: #1b1a17;
    --lens-none: none;
  }

  .receipt :global([data-part='page']) {
    text-transform: uppercase;
  }

  .receipt :global([data-part='name']) {
    position: relative;
    color: var(--lens-fg);
    font-weight: 700;
    letter-spacing: 0.35em;
  }

  .receipt :global([data-part='name']::before),
  .receipt :global([data-part='name']::after) {
    content: '***';
    position: absolute;
    top: 0;
    font-weight: 400;
    letter-spacing: 0.2em;
  }

  .receipt :global([data-part='name']::before) {
    right: calc(100% + 0.6em);
  }

  .receipt :global([data-part='name']::after) {
    left: calc(100% + 0.25em);
  }

  .receipt :global([data-part='headline']) {
    font-weight: 700;
    letter-spacing: 0;
  }

  .receipt :global([data-part='headline'] [data-part='mark']::before) {
    inset: -5px;
  }

  .receipt :global([data-part='updated']),
  .receipt :global([data-part='stat-label']),
  .receipt :global([data-part='axis']) {
    letter-spacing: 0.08em;
  }

  .receipt :global([data-part='monitors']),
  .receipt :global([data-part='monitor']) {
    border-style: dashed;
  }

  .receipt :global([data-part='mark'][data-status]),
  .receipt :global([data-part='tooltip-mark'][data-status]) {
    border-radius: 0;
    background: none;
  }

  .receipt :global([data-part='mark']::before),
  .receipt :global([data-part='tooltip-mark']::before) {
    content: '';
    position: absolute;
    inset: -3px;
    background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12'%3E%3Crect x='.75' y='.75' width='10.5' height='10.5' fill='none' stroke='%231b1a17' stroke-width='1.5'/%3E%3C/svg%3E")
      center / contain no-repeat;
  }

  .receipt :global([data-part='mark'][data-status='operational']::before),
  .receipt :global([data-part='mark'][data-status='up']::before),
  .receipt :global([data-part='tooltip-mark'][data-status='up']::before) {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12'%3E%3Crect width='12' height='12' fill='%231b1a17'/%3E%3Cpath d='M3 6.2 5.1 8.3 9 3.9' fill='none' stroke='%23fbfaf6' stroke-width='1.6'/%3E%3C/svg%3E");
  }

  .receipt :global([data-part='mark'][data-status='degraded']::before),
  .receipt :global([data-part='tooltip-mark'][data-status='degraded']::before) {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12'%3E%3Crect width='12' height='12' fill='%231b1a17'/%3E%3Cpath d='M6 2.6v6.8M3.05 4.3l5.9 3.4M3.05 7.7l5.9-3.4' fill='none' stroke='%23fbfaf6' stroke-width='1.4'/%3E%3C/svg%3E");
  }

  .receipt :global([data-part='mark'][data-status='outage']::before),
  .receipt :global([data-part='mark'][data-status='down']::before),
  .receipt :global([data-part='tooltip-mark'][data-status='down']::before) {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12'%3E%3Crect width='12' height='12' fill='%231b1a17'/%3E%3Cpath d='M3.5 3.5l5 5M8.5 3.5l-5 5' fill='none' stroke='%23fbfaf6' stroke-width='1.6'/%3E%3C/svg%3E");
  }

  .receipt :global([data-part='monitor-name']) {
    position: relative;
    font-weight: 700;
  }

  .receipt :global([data-part='monitor-name']::before) {
    content: '1x';
    position: absolute;
    right: calc(100% + 0.7em);
    color: var(--lens-muted);
    font-size: 0.78em;
    font-weight: 400;
  }

  .receipt :global([data-part='monitor-status']) {
    letter-spacing: 0.06em;
  }

  .receipt
    :global(
      [data-part='mark'][data-status='degraded'] + [data-part='monitor-status']
    ),
  .receipt
    :global(
      [data-part='mark'][data-status='down'] + [data-part='monitor-status']
    ) {
    position: relative;
    isolation: isolate;
    color: var(--lens-bg);
    font-weight: 700;
  }

  .receipt
    :global(
      [data-part='mark'][data-status='degraded']
        + [data-part='monitor-status']::before
    ),
  .receipt
    :global(
      [data-part='mark'][data-status='down']
        + [data-part='monitor-status']::before
    ) {
    content: '';
    position: absolute;
    inset: 4px -4px;
    z-index: -1;
    background: var(--lens-fg);
  }

  .receipt :global([data-part='stat-value']) {
    font-weight: 700;
  }

  .receipt :global([data-part='stat']:last-child [data-part='stat-value']) {
    text-decoration: underline double;
    text-underline-offset: 5px;
  }

  .receipt :global([data-part='axis']) {
    position: relative;
  }

  .receipt :global([data-part='axis']::after) {
    content: '9 999999 999999';
    position: absolute;
    inset-inline: 0;
    text-align: center;
    letter-spacing: 0.15em;
  }

  .receipt :global([data-part='chart'] [data-part='day']) {
    border-radius: 0;
  }

  .receipt
    :global(
      [data-part='day'][data-status='up']:is(
          :nth-child(3n + 1),
          :nth-child(5n + 2)
        )
    ) {
    background-size: 1px 100%;
  }

  .receipt :global([data-part='chart'] [data-part='day'][data-open]) {
    margin-block: 0 -6px;
    background: linear-gradient(#c8102e 0 0) 50% 0 / 3px 100% no-repeat;
  }

  .receipt
    :global(
      [data-part='chart'] [data-part='day'][data-status='degraded'][data-open]
    ) {
    background-size: 4px 100%;
  }

  .receipt
    :global(
      [data-part='chart'] [data-part='day'][data-status='down'][data-open]
    ) {
    background: #c8102e;
  }

  .receipt
    :global(
      [data-part='chart'] [data-part='day'][data-status='none'][data-open]
    ) {
    background: repeating-linear-gradient(#c8102e 0 3px, transparent 3px 6px)
      50% 0 / 1px 100% no-repeat;
  }

  .receipt :global([data-part='chart']:has([data-open])::after) {
    content: '';
    position: absolute;
    top: calc(50% - 1px);
    left: -14px;
    right: -14px;
    height: 2px;
    border-radius: 1px;
    background: linear-gradient(
      90deg,
      #ff1f3a00,
      #ff1f3a 14px,
      #ff1f3a calc(100% - 14px),
      #ff1f3a00
    );
    box-shadow: 0 0 6px 1px rgba(255, 31, 58, 0.45);
    pointer-events: none;
  }

  .receipt :global([data-part='tooltip']) {
    gap: 3px;
    padding: 10px 14px;
    border: 0;
    border-radius: 0;
    background: none;
    box-shadow: none;
    filter: drop-shadow(0 0 1px rgba(64, 48, 24, 0.45))
      drop-shadow(0 6px 8px rgba(64, 48, 24, 0.22));
    letter-spacing: 0.04em;
  }

  .receipt :global([data-part='tooltip']::before) {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    background:
      url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 6 3'%3E%3Cpath d='M0 3 3 0l3 3z' fill='%23fbfaf6'/%3E%3C/svg%3E")
        0 0 / 6px 3px round no-repeat,
      url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 6 3'%3E%3Cpath d='M0 0 3 3l3-3z' fill='%23fbfaf6'/%3E%3C/svg%3E")
        0 100% / 6px 3px round no-repeat,
      linear-gradient(#fbfaf6 0 0) 0 3px / 100% calc(100% - 6px) no-repeat;
  }

  .receipt :global([data-part='tooltip-date']) {
    margin-bottom: 3px;
    padding-bottom: 6px;
    border-bottom: 1px dashed var(--lens-fg);
    font-weight: 700;
  }

  .receipt :global([data-part='tooltip-zone']) {
    color: var(--lens-muted);
  }

  .receipt :global([data-part='tooltip-uptime']) {
    position: relative;
    gap: 7px;
    padding-right: 60px;
    font-weight: 700;
  }

  .receipt :global([data-part='tooltip-mark']) {
    width: 12px;
    height: 12px;
  }

  .receipt :global([data-part='tooltip-mark']::before) {
    inset: 0;
  }

  .receipt :global([data-part='tooltip-checks']) {
    color: var(--lens-fg);
  }

  .receipt :global([data-part='tooltip-uptime']::after) {
    position: absolute;
    top: 50%;
    right: 0;
    translate: 0 -50%;
    padding: 0 4px 0 calc(4px + 0.12em);
    border: 2px solid #c8102e;
    border-radius: 2px;
    color: #c8102e;
    font-size: 10px;
    font-weight: 800;
    line-height: 13px;
    letter-spacing: 0.12em;
    rotate: -7deg;
  }

  .receipt
    :global(
      [data-part='tooltip'][data-status='up']
        [data-part='tooltip-uptime']::after
    ) {
    content: 'PAID';
  }

  .receipt
    :global(
      [data-part='tooltip'][data-status='degraded']
        [data-part='tooltip-uptime']::after
    ) {
    content: 'SHORT';
  }

  .receipt
    :global(
      [data-part='tooltip'][data-status='down']
        [data-part='tooltip-uptime']::after
    ) {
    content: 'VOID';
    rotate: -10deg;
  }

  .stamp {
    top: 172px;
    left: calc(50% + 26px);
    rotate: -3deg;
    mix-blend-mode: multiply;
    pointer-events: none;
  }

  .stamp text {
    font-weight: 800;
    letter-spacing: 0.08em;
  }

  @media (prefers-reduced-motion: no-preference) {
    .receipt :global([data-part='tooltip']) {
      animation: receipt-print 160ms cubic-bezier(0.2, 0.8, 0.2, 1);
    }

    .receipt :global([data-part='tooltip-uptime']::after) {
      animation: receipt-stamp 150ms 70ms cubic-bezier(0.3, 0, 0.6, 1) backwards;
    }

    .receipt :global([data-part='chart']:has([data-open])::after) {
      animation:
        receipt-laser 140ms ease-out,
        receipt-hum 900ms 140ms ease-in-out infinite alternate;
    }
  }

  @keyframes receipt-print {
    from {
      opacity: 0;
      transform: translateY(6px);
    }
  }

  @keyframes receipt-laser {
    from {
      opacity: 0;
      transform: scaleX(0.3);
    }
  }

  @keyframes receipt-stamp {
    from {
      opacity: 0;
      scale: 1.8;
    }
  }

  @keyframes receipt-hum {
    to {
      opacity: 0.72;
    }
  }

  @media (width < 40rem) {
    .receipt :global([data-part='headline']) {
      letter-spacing: -0.02em;
    }

    .receipt :global([data-part='axis']::after) {
      content: none;
    }

    .receipt :global([data-part='updated']),
    .receipt :global([data-part='stat-label']) {
      letter-spacing: 0;
    }

    .stamp {
      top: 188px;
      left: calc(50% - 86px);
    }
  }
</style>
