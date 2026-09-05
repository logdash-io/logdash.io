<script lang="ts">
  import { resolve } from '$app/paths';
  import Footer from '$lib/landing/Footer.svelte';
  import { FEATURES } from '$lib/domains/shared/constants/features.js';
  import { RoutePath } from '$lib/domains/shared/route-path.js';
  import SeoMeta from '$lib/domains/shared/ui/SeoMeta.svelte';
  import {
    ActivityIcon,
    ArrowRightIcon,
    BellIcon,
    ChartSplineIcon,
    CheckCircleIcon,
    LogsIcon,
  } from 'lucide-svelte';

  const feature = FEATURES.find((f) => f.slug === 'monitoring') ?? FEATURES[0];
  const Icon = feature.icon;

  const benefits = [
    {
      text: feature.benefits[0],
      icon: CheckCircleIcon,
    },
    {
      text: feature.benefits[1],
      icon: ActivityIcon,
    },
    {
      text: feature.benefits[2],
      icon: BellIcon,
    },
  ];

  /** Mirrors the real flow: quick setup, then the monitor's notification channels. */
  const setupSteps = [
    {
      title: 'Paste your URL',
      detail:
        'Logdash starts calling it right away, on the interval you pick. Every check records the status code and how long the response took.',
    },
    {
      title: 'Connect Telegram',
      detail:
        "Open the monitor's notification channels, add @logdash_uptime_bot to your chat or group, and send it the passphrase Logdash shows you.",
    },
    {
      title: 'Wait for something to break',
      detail:
        'Next time a check fails, the alert lands in your Telegram within one check interval. Webhooks work the same way if you would rather route it yourself.',
    },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Logdash Monitoring',
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Cloud',
    description:
      'HTTP checks and cron heartbeats on the interval you pick, with Telegram and webhook alerts the moment one fails.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };
</script>

<SeoMeta
  title="Uptime monitoring with Telegram alerts | Logdash"
  description="HTTP checks and cron heartbeats on the interval you pick. When one fails, the Telegram alert reaches you before the first support message."
  keywords="uptime monitoring, cron heartbeat monitoring, telegram downtime alerts, website monitoring, logdash monitoring"
  {jsonLd}
/>

<div class="mx-auto flex w-full max-w-landing flex-col">
  <!-- Centralized Hero Section -->
  <section
    class="mx-auto w-full max-w-4xl px-6 pb-16 pt-16 md:pt-24 text-center"
  >
    <div class="mb-8 flex justify-center">
      <div
        class="flex items-center gap-3 size-22 rounded-3xl bg-primary/10 fcc"
      >
        <Icon class="text-primary h-12 w-12" />
      </div>
    </div>

    <h1 class="mb-6 text-4xl font-semibold tracking-tight md:text-6xl">
      Uptime monitoring for SaaS apps
    </h1>

    <p
      class="text-neutral-400 mx-auto mb-10 max-w-2xl text-xl leading-relaxed text-pretty"
    >
      HTTP checks as often as every
      <span class="text-base-content font-mono text-base font-semibold">
        15s
      </span>
      on your endpoints, plus heartbeats from your cron jobs. When one fails, Telegram
      tells you before your users do.
    </p>

    <div class="flex flex-col items-center justify-center gap-4 sm:flex-row">
      <a
        href={resolve(RoutePath.QUICK_SETUP)}
        rel="nofollow"
        class="btn btn-primary w-full sm:w-auto"
        data-posthog-id="feature-monitoring-cta"
      >
        Start monitoring
        <ArrowRightIcon class="ml-1 size-4" />
      </a>
      <a
        href={resolve('/demo-dashboard')}
        class="btn btn-secondary w-full sm:w-auto"
        data-posthog-id="feature-monitoring-demo-cta"
      >
        See the live demo
      </a>
    </div>
  </section>

  <!-- Deep-Dive Problem Section -->
  <section class="mx-auto w-full max-w-5xl px-6 py-16">
    <div class="ld-card-base rounded-3xl p-8 md:p-12">
      <h2 class="mb-6 text-3xl font-semibold md:text-4xl">
        The Fear of Silence
      </h2>
      <div class="flex flex-col gap-8 md:flex-row md:gap-12">
        <div class="flex-1">
          <p class="text-neutral-300 text-lg leading-relaxed">
            There is a specific kind of anxiety when you launch a product. You
            check your phone every hour. Is it working? Did the server crash? Is
            the database up?
          </p>
          <p class="text-neutral-300 mt-4 text-lg leading-relaxed">
            You shouldn't have to live like that. You need a system that taps
            you on the shoulder only when it's important, so you can actually
            enjoy your dinner.
          </p>
        </div>
        <div class="flex-1">
          <h3 class="mb-4 text-xl font-semibold">Peace of mind means...</h3>
          <ul class="space-y-4">
            <li class="text-neutral-200 flex items-start gap-3">
              <span class="text-success mt-1">✓</span>
              <span>Not refreshing your own website to see if it loads.</span>
            </li>
            <li class="text-neutral-200 flex items-start gap-3">
              <span class="text-success mt-1">✓</span>
              <span>
                Knowing you'll get a Telegram message instantly if it breaks.
              </span>
            </li>
            <li class="text-neutral-200 flex items-start gap-3">
              <span class="text-success mt-1">✓</span>
              <span>Sleeping soundly because someone else is on watch.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>

  <!-- Detailed Value Proposition -->
  <section class="mx-auto w-full max-w-5xl px-6 py-16 text-center">
    <h2 class="mb-6 text-3xl font-semibold md:text-4xl">
      We poke it so you don't have to.
    </h2>
    <p class="text-neutral-300 mx-auto mb-12 max-w-3xl text-xl">
      We call your endpoints and check the status code and how long the response
      took. Your cron jobs call us back when they finish. If either goes quiet,
      you hear about it.
    </p>

    <!-- Feature Highlights -->
    <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
      {#each benefits as benefit (benefit.text)}
        <div class="ld-card-base rounded-3xl p-6 text-left">
          <div
            class="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"
          >
            <benefit.icon class="h-6 w-6" />
          </div>
          <p class="text-lg font-medium">{benefit.text}</p>
        </div>
      {/each}
    </div>
  </section>

  <!-- Telegram setup, three steps -->
  <section class="mx-auto w-full max-w-5xl px-6 py-16">
    <h2 class="mb-6 text-3xl font-semibold md:text-4xl">
      Three steps to a Telegram alert
    </h2>
    <p class="text-neutral-300 mb-10 max-w-3xl text-xl">
      No agent to install, no YAML. You can be done before your coffee cools.
    </p>

    <ol class="space-y-8">
      {#each setupSteps as step, index (step.title)}
        <li class="flex items-start gap-4">
          <span
            class="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-semibold"
          >
            {index + 1}
          </span>
          <div>
            <h3 class="mb-1 text-xl font-semibold">{step.title}</h3>
            <p class="text-neutral-300 text-lg leading-relaxed">
              {step.detail}
            </p>
          </div>
        </li>
      {/each}
    </ol>
  </section>

  <!-- Navigation -->
  <section class="mx-auto w-full max-w-5xl px-6 py-16">
    <h2 class="mb-8 text-center text-3xl font-semibold">
      Explore other features
    </h2>
    <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
      <a
        class="ld-card-base rounded-3xl p-8 transition-ink hover:border-neutral-700"
        href={resolve('/features/logging')}
        data-posthog-id="feature-monitoring-other-logging"
      >
        <div
          class="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"
        >
          <LogsIcon class="h-6 w-6" />
        </div>
        <h3 class="mb-2 text-2xl font-semibold">Logging</h3>
        <p class="text-neutral-300">Find the error behind the alert.</p>
      </a>
      <a
        class="ld-card-base rounded-3xl p-8 transition-ink hover:border-neutral-700"
        href={resolve('/features/metrics')}
        data-posthog-id="feature-monitoring-other-metrics"
      >
        <div
          class="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"
        >
          <ChartSplineIcon class="h-6 w-6" />
        </div>
        <h3 class="mb-2 text-2xl font-semibold">Metrics</h3>
        <p class="text-neutral-300">Watch the numbers that go bad first.</p>
      </a>
    </div>
  </section>

  <div class="distance h-16"></div>

  <Footer />
</div>
