<script lang="ts">
  import { resolve } from '$app/paths';
  import Footer from '$lib/landing/Footer.svelte';
  import FrameworksList from '$lib/landing/FrameworksList.svelte';
  import { FEATURES } from '$lib/domains/shared/constants/features.js';
  import { RoutePath } from '$lib/domains/shared/route-path.js';
  import SeoMeta from '$lib/domains/shared/ui/SeoMeta.svelte';
  import {
    ActivityIcon,
    ArrowRightIcon,
    BarChart2Icon,
    HeartPulseIcon,
    LogsIcon,
    ZapIcon,
  } from 'lucide-svelte';

  const feature = FEATURES.find((f) => f.slug === 'metrics') ?? FEATURES[0];
  const Icon = feature.icon;

  const benefits = [
    {
      text: feature.benefits[0],
      icon: BarChart2Icon,
    },
    {
      text: feature.benefits[1],
      icon: ActivityIcon,
    },
    {
      text: feature.benefits[2],
      icon: ZapIcon,
    },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Logdash Metrics',
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Cloud',
    description:
      'Response time on every HTTP check, plus your own counters and gauges, so a slowdown shows up before it becomes downtime.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };
</script>

<SeoMeta
  title="API response time and metrics | Logdash"
  description="Watch response time, queue depth and error rate. Logdash charts every number you push, so the slowdown shows up before it becomes downtime."
  keywords="response time monitoring, api latency alerts, system metrics, counters, gauges, prometheus alternative, logdash metrics"
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
      Response time and metrics for your API
    </h1>

    <p
      class="text-neutral-400 mx-auto mb-10 max-w-2xl text-xl leading-relaxed text-pretty"
    >
      Every HTTP check records how long your endpoint took, and anything slower
      than
      <span class="text-base-content font-mono text-base font-semibold">
        10s
      </span>
      counts as down. Push your own counters and gauges for the numbers a check cannot
      see: queue depth, database latency, error rate.
    </p>

    <div class="flex flex-col items-center justify-center gap-4 sm:flex-row">
      <a
        href={resolve(RoutePath.QUICK_SETUP)}
        rel="nofollow"
        class="btn btn-primary w-full sm:w-auto"
        data-posthog-id="feature-metrics-cta"
      >
        Start tracking
        <ArrowRightIcon class="ml-1 h-5 w-5" />
      </a>
      <a
        href={resolve('/demo-dashboard')}
        class="btn btn-secondary w-full sm:w-auto"
        data-posthog-id="feature-metrics-demo-cta"
      >
        See the live demo
      </a>
    </div>
  </section>

  <FrameworksList />

  <!-- Deep-Dive Problem Section -->
  <section class="mx-auto w-full max-w-5xl px-6 py-16">
    <div class="ld-card-base rounded-3xl p-8 md:p-12">
      <h2 class="mb-6 text-3xl font-semibold md:text-4xl">
        Flying Blind on Infrastructure
      </h2>
      <div class="flex flex-col gap-8 md:flex-row md:gap-12">
        <div class="flex-1">
          <p class="text-neutral-300 text-lg leading-relaxed">
            It's easy to track signups. It's harder to know if your background
            worker is stuck, or if that new query you wrote is timing out for 5%
            of users.
          </p>
          <p class="text-neutral-300 mt-4 text-lg leading-relaxed">
            When things feel "sluggish", you shouldn't have to guess why. You
            need raw, technical counters and gauges that tell you exactly which
            part of your system is sweating.
          </p>
        </div>
        <div class="flex-1">
          <h3 class="mb-4 text-xl font-semibold">The backend black box</h3>
          <ul class="space-y-4">
            <li class="text-neutral-200 flex items-start gap-3">
              <span class="text-error mt-1">✕</span>
              <span>"Why is the API slow?" becomes a guessing game.</span>
            </li>
            <li class="text-neutral-200 flex items-start gap-3">
              <span class="text-error mt-1">✕</span>
              <span>
                You don't know if your cron jobs actually finished successfully.
              </span>
            </li>
            <li class="text-neutral-200 flex items-start gap-3">
              <span class="text-error mt-1">✕</span>
              <span>
                You deploy a change and wait for user complaints to know if it
                broke performance.
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>

  <!-- Detailed Value Proposition -->
  <section class="mx-auto w-full max-w-5xl px-6 py-16 text-center">
    <h2 class="mb-6 text-3xl font-semibold md:text-4xl">
      The number moves first, the outage follows
    </h2>
    <p class="text-neutral-300 mx-auto mb-12 max-w-3xl text-xl">
      Counters and gauges from Node, Python, Ruby, Java, .NET and Go. Measure
      how long things take and how many things happened, then watch the line
      bend a day before it takes the service down with it.
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

  <!-- Navigation -->
  <section class="mx-auto w-full max-w-5xl px-6 py-16">
    <h2 class="mb-8 text-center text-3xl font-semibold">
      Explore other features
    </h2>
    <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
      <a
        class="ld-card-base rounded-3xl p-8 transition-ink hover:border-neutral-700"
        href={resolve('/features/logging')}
        data-posthog-id="feature-metrics-other-logging"
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
        href={resolve('/features/monitoring')}
        data-posthog-id="feature-metrics-other-monitoring"
      >
        <div
          class="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"
        >
          <HeartPulseIcon class="h-6 w-6" />
        </div>
        <h3 class="mb-2 text-2xl font-semibold">Monitoring</h3>
        <p class="text-neutral-300">HTTP checks and cron heartbeats.</p>
      </a>
    </div>
  </section>

  <div class="distance h-16"></div>

  <Footer />
</div>
