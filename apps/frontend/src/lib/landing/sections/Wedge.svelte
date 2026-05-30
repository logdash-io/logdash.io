<script lang="ts">
  // ── wedge comparison: fly blind vs roll your own vs logdash ──────
  type Mark = 'good' | 'bad';
  type Row = { mark: Mark; html: string };
  type Col = {
    badge: string;
    title: string;
    win?: boolean;
    rows: Row[];
  };

  const columns: Col[] = [
    {
      badge: 'Today',
      title: 'Fly blind',
      rows: [
        {
          mark: 'bad',
          html: `You find out you're down from an angry customer`,
        },
        { mark: 'bad', html: `Silent errors quietly churn paying users` },
        {
          mark: 'bad',
          html: `<code>console.log</code> vanishes on restart — no history`,
        },
        { mark: 'bad', html: `No idea what "normal" even looks like` },
      ],
    },
    {
      badge: 'DIY',
      title: 'Roll your own',
      rows: [
        { mark: 'bad', html: `A weekend wiring Prometheus + Grafana + Loki` },
        {
          mark: 'bad',
          html: `Glue logs, metrics &amp; uptime together yourself`,
        },
        {
          mark: 'bad',
          html: `Babysit instances, updates &amp; storage forever`,
        },
        { mark: 'bad', html: `Pay in server costs + your time` },
      ],
    },
    {
      badge: 'logdash',
      title: 'Just ship',
      win: true,
      rows: [
        { mark: 'good', html: `60 seconds, one line of SDK` },
        { mark: 'good', html: `Logs + metrics + uptime in one dashboard` },
        { mark: 'good', html: `Alerts to Telegram/Discord when it matters` },
        { mark: 'good', html: `One small bill — nothing to host or maintain` },
      ],
    },
  ];
</script>

<section class="band">
  <div class="inner">
    <div class="label">Why not just…</div>
    <h2>Flying blind costs more than you think</h2>
    <p class="lead">
      You have three options. Two of them cost you customers or weekends.
    </p>

    <div class="wedge">
      {#each columns as col (col.badge)}
        <div class="col" class:win={col.win}>
          <h3>
            <span class="badge">{col.badge}</span>
            {col.title}
          </h3>
          {#each col.rows as row (row.html)}
            <div class="row">
              <span class="m {row.mark}">
                {row.mark === 'good' ? '✓' : '✗'}
              </span>
              <span class="txt">{@html row.html}</span>
            </div>
          {/each}
        </div>
      {/each}
    </div>
  </div>
</section>

<style>
  .band {
    position: relative;
    z-index: 1;
    width: 100%;
    background: var(--surface);
  }
  .inner {
    max-width: 1080px;
    margin: 0 auto;
    padding: clamp(64px, 9vh, 96px) 24px;
  }

  .label {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--brand-soft);
    margin-bottom: 14px;
    text-align: center;
  }
  h2 {
    font-size: clamp(28px, 3.6vw, 44px);
    line-height: 1.08;
    letter-spacing: -0.025em;
    font-weight: 800;
    text-align: center;
    max-width: 20ch;
    margin: 0 auto;
    color: var(--fg);
  }
  .lead {
    font-size: clamp(15px, 1.5vw, 18px);
    color: var(--fg-muted);
    text-align: center;
    max-width: 56ch;
    margin: 14px auto 0;
    line-height: 1.55;
  }

  .wedge {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 18px;
    margin-top: 40px;
  }
  .col {
    background: var(--surface-raised);
    border: 1px solid var(--line);
    border-radius: 18px;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .col.win {
    border-color: color-mix(in srgb, var(--brand) 55%, transparent);
    box-shadow:
      0 0 0 1px color-mix(in srgb, var(--brand) 30%, transparent),
      0 0 0 5px color-mix(in srgb, var(--brand) 12%, transparent),
      0 24px 60px -28px color-mix(in srgb, var(--brand) 50%, transparent);
  }
  .col h3 {
    font-size: 17px;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 9px;
    color: var(--fg);
  }
  .badge {
    font-size: 11px;
    font-weight: 700;
    padding: 3px 9px;
    border-radius: 7px;
    background: var(--surface-overlay);
    color: var(--fg-muted);
  }
  .col.win .badge {
    background: var(--brand);
    color: #fff;
  }
  .row {
    display: flex;
    gap: 10px;
    font-size: 13.5px;
    color: var(--fg-muted);
    line-height: 1.45;
  }
  .m {
    flex-shrink: 0;
    font-weight: 700;
  }
  .m.bad {
    color: var(--color-red-600);
  }
  .m.good {
    color: var(--color-green-600);
  }
  .txt :global(code) {
    font-family: var(--font-mono, monospace);
    font-size: 0.9em;
    color: var(--fg);
    background: var(--surface-overlay);
    border: 1px solid var(--line-soft);
    border-radius: 5px;
    padding: 1px 5px;
  }

  @media (max-width: 820px) {
    .wedge {
      grid-template-columns: 1fr;
    }
  }
</style>
