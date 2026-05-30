<script lang="ts">
  import {
    ScrollTextIcon,
    ChartLineIcon,
    ShieldCheckIcon,
  } from 'lucide-svelte';

  type Pillar = {
    icon: typeof ScrollTextIcon;
    title: string;
    body: string;
  };

  const pillars: Pillar[] = [
    {
      icon: ScrollTextIcon,
      title: 'Logs',
      body: 'Every request, error and event in one real-time, searchable stream. Structured, filterable, zero setup.',
    },
    {
      icon: ChartLineIcon,
      title: 'Metrics',
      body: "Latency, throughput, error rate — anything you can count. Charts that don't need a handbook, alerts when they spike.",
    },
    {
      icon: ShieldCheckIcon,
      title: 'Uptime',
      body: 'We ping your services every 15s and ping you the second one drops. Public status pages included, free.',
    },
  ];
</script>

<section class="pillars">
  <div class="inner">
    <div class="label">One dashboard, three superpowers</div>
    <h2>Everything you need to know your app is OK</h2>

    <div class="grid3">
      {#each pillars as p (p.title)}
        <div class="card">
          <div class="ico">
            <p.icon size={20} strokeWidth={2} />
          </div>
          <h3>{p.title}</h3>
          <p>{p.body}</p>
        </div>
      {/each}
    </div>
  </div>
</section>

<style>
  .pillars {
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

  .grid3 {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 18px;
    margin-top: 40px;
  }
  .card {
    background: var(--surface-raised);
    border: 1px solid var(--line);
    border-radius: 18px;
    padding: 24px;
  }
  .ico {
    width: 42px;
    height: 42px;
    border-radius: 11px;
    background: color-mix(in srgb, var(--brand) 16%, transparent);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--brand-soft);
    margin-bottom: 14px;
  }
  .card h3 {
    font-size: 18px;
    font-weight: 700;
    margin-bottom: 7px;
    color: var(--fg);
  }
  .card p {
    font-size: 14px;
    color: var(--fg-muted);
    line-height: 1.55;
  }

  @media (max-width: 820px) {
    .grid3 {
      grid-template-columns: 1fr;
    }
  }
</style>
