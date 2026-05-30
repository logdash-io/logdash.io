<script lang="ts">
  import { ArrowRightIcon } from 'lucide-svelte';

  // Real tiers — numbers mirror feature-comparison.config.ts exactly.
  const tiers = [
    {
      name: 'Hobby',
      price: 'Free',
      cadence: '',
      blurb: 'For the side project you just shipped.',
      bullets: [
        '5 services',
        '24h log retention',
        '1 monitor per service (5min pings)',
        'Telegram & webhook alerts',
      ],
      cta: { label: 'Start free', href: '/app/auth' },
      featured: false,
    },
    {
      name: 'Builder',
      price: '$9',
      cadence: '/month',
      blurb: 'When it starts to look like a business.',
      bullets: [
        '20 services',
        '7-day log retention',
        '1min pings + uptime history',
        'Priority support & catch-up calls',
      ],
      cta: { label: 'See plans', href: '/pricing' },
      featured: true,
    },
    {
      name: 'Pro',
      price: '$15',
      cadence: '/month',
      blurb: 'For the founder protecting real revenue.',
      bullets: [
        '50 services',
        '30-day log retention',
        '15s pings + 99.9% uptime SLA',
        'Custom status page domain',
      ],
      cta: { label: 'Get Pro', href: '/pricing' },
      featured: false,
    },
  ];
</script>

<section class="pricing">
  <div class="inner">
    <header class="head">
      <span class="label">Pricing</span>
      <h2>One small bill. Not an enterprise contract.</h2>
      <p class="lead">
        Start free, no card required. Upgrade when your side project starts
        paying you back.
      </p>
    </header>

    <div class="grid">
      {#each tiers as tier (tier.name)}
        <div class="card" class:featured={tier.featured}>
          {#if tier.featured}
            <span class="rec">Recommended</span>
          {/if}
          <div class="name">{tier.name}</div>
          <div class="price">
            <span class="amount">{tier.price}</span>
            {#if tier.cadence}<span class="cadence">{tier.cadence}</span>{/if}
          </div>
          <p class="blurb">{tier.blurb}</p>
          <ul class="bullets">
            {#each tier.bullets as bullet (bullet)}
              <li>
                <svg
                  class="tick"
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M3.5 8.5l3 3 6-7"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
                {bullet}
              </li>
            {/each}
          </ul>
          <a
            href={tier.cta.href}
            class="cta"
            class:primary={tier.featured}
            data-posthog-id={`landing-pricing-${tier.name.toLowerCase()}`}
          >
            {tier.cta.label}
            <ArrowRightIcon class="size-4" />
          </a>
        </div>
      {/each}
    </div>
  </div>
</section>

<style>
  .pricing {
    background: var(--surface);
    padding: clamp(64px, 9vw, 120px) 24px;
  }
  .inner {
    max-width: 1080px;
    margin: 0 auto;
  }

  .head {
    text-align: center;
    margin-bottom: clamp(36px, 5vw, 56px);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
  }
  .label {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--brand);
  }
  h2 {
    font-size: clamp(28px, 4vw, 44px);
    line-height: 1.08;
    letter-spacing: -0.025em;
    font-weight: 800;
    color: var(--fg);
    max-width: 20ch;
  }
  .lead {
    font-size: clamp(16px, 1.5vw, 19px);
    color: var(--fg-muted);
    line-height: 1.5;
    max-width: 52ch;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    align-items: stretch;
  }

  .card {
    position: relative;
    display: flex;
    flex-direction: column;
    background: var(--surface-raised);
    border: 1px solid var(--line);
    border-radius: 18px;
    padding: 28px 24px;
  }
  .card.featured {
    border-color: var(--brand);
    box-shadow: 0 0 0 1px var(--brand);
  }

  .rec {
    position: absolute;
    top: -11px;
    left: 24px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #fff;
    background: var(--brand);
    padding: 3px 10px;
    border-radius: 999px;
  }

  .name {
    font-size: 15px;
    font-weight: 600;
    color: var(--fg-muted);
  }
  .price {
    margin-top: 10px;
    display: flex;
    align-items: baseline;
    gap: 4px;
  }
  .amount {
    font-size: 40px;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: var(--fg);
  }
  .cadence {
    font-size: 15px;
    color: var(--fg-faint);
    font-weight: 500;
  }
  .blurb {
    margin-top: 8px;
    font-size: 14px;
    color: var(--fg-muted);
    line-height: 1.5;
    min-height: 2lh;
  }

  .bullets {
    margin: 22px 0 26px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    flex: 1;
  }
  .bullets li {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    font-size: 14.5px;
    color: var(--fg);
    line-height: 1.4;
  }
  .tick {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    margin-top: 2px;
    color: var(--brand);
  }

  .cta {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    width: 100%;
    padding: 12px 18px;
    border-radius: 999px;
    font-size: 15px;
    font-weight: 600;
    border: 1px solid var(--line);
    background: var(--surface-overlay);
    color: var(--fg);
    transition:
      background 0.18s ease,
      border-color 0.18s ease,
      opacity 0.18s ease;
  }
  .cta:hover {
    background: color-mix(in srgb, var(--fg) 6%, transparent);
    border-color: var(--line);
  }
  .cta.primary {
    background: var(--brand);
    border-color: var(--brand);
    color: #fff;
  }
  .cta.primary:hover {
    opacity: 0.92;
  }

  @media (max-width: 820px) {
    .grid {
      grid-template-columns: 1fr;
      max-width: 420px;
      margin: 0 auto;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .cta {
      transition: none;
    }
  }
</style>
