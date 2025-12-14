<script lang="ts">
  import AnimatedView from '$lib/domains/shared/ui/AnimatedView.svelte';
  import Footer from '$lib/landing/Footer.svelte';
  import { FEATURES } from '$lib/domains/shared/constants/features.js';
  import { RoutePath } from '$lib/domains/shared/route-path.js';
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
</script>

<svelte:head>
  <title>Metrics | Logdash</title>
  <meta
    name="description"
    content="Know if your code is slow before your users do. Simple counters, gauges, and system health metrics without the complexity."
  />
</svelte:head>

<AnimatedView class="mx-auto flex w-full max-w-7xl flex-col">
  <!-- Centralized Hero Section -->
  <section class="mx-auto w-full max-w-4xl px-6 pb-16 pt-24 text-center">
    <div class="mb-8 flex justify-center">
      <div class="flex items-center gap-3">
        <Icon class="text-primary h-12 w-12" />
      </div>
    </div>

    <h1 class="mb-6 text-4xl font-extrabold tracking-tight md:text-6xl">
      Vital signs for your business
    </h1>

    <p
      class="text-base-content/70 mx-auto mb-10 max-w-2xl text-xl leading-relaxed"
    >
      Track sign-ups, payments, database latency, job queue depth, and error
      rates without setting up Prometheus or paying $50 Vercel bill.
    </p>

    <div class="flex flex-col items-center justify-center gap-4 sm:flex-row">
      <a
        href={RoutePath.AUTH}
        class="btn btn-primary w-full sm:w-auto"
        data-posthog-id="feature-metrics-cta"
      >
        Track system health
        <ArrowRightIcon class="ml-1 h-5 w-5" />
      </a>
      <a
        href="/demo-dashboard"
        class="btn btn-secondary w-full sm:w-auto"
        data-posthog-id="feature-metrics-demo-cta"
      >
        See the live demo
      </a>
    </div>
  </section>

  <!-- Deep-Dive Problem Section -->
  <section class="mx-auto w-full max-w-5xl px-6 py-16">
    <div class="ld-card-base rounded-3xl p-8 md:p-12">
      <h2 class="mb-6 text-3xl font-bold md:text-4xl">
        Flying Blind on Infrastructure
      </h2>
      <div class="flex flex-col gap-8 md:flex-row md:gap-12">
        <div class="flex-1">
          <p class="text-lg leading-relaxed opacity-80">
            It's easy to track signups. It's harder to know if your background
            worker is stuck, or if that new query you wrote is timing out for 5%
            of users.
          </p>
          <p class="mt-4 text-lg leading-relaxed opacity-80">
            When things feel "sluggish", you shouldn't have to guess why. You
            need raw, technical counters and gauges that tell you exactly which
            part of your system is sweating.
          </p>
        </div>
        <div class="flex-1">
          <h3 class="mb-4 text-xl font-semibold">The backend black box</h3>
          <ul class="space-y-4">
            <li class="flex items-start gap-3 opacity-90">
              <span class="text-error mt-1">✕</span>
              <span>"Why is the API slow?" becomes a guessing game.</span>
            </li>
            <li class="flex items-start gap-3 opacity-90">
              <span class="text-error mt-1">✕</span>
              <span>
                You don't know if your cron jobs actually finished successfully.
              </span>
            </li>
            <li class="flex items-start gap-3 opacity-90">
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
    <h2 class="mb-6 text-3xl font-bold md:text-4xl">
      Engineering Clarity, Instantly
    </h2>
    <p class="mx-auto mb-12 max-w-3xl text-xl opacity-80">
      Simple counters, gauges, and histograms. Measure how long things take and
      how many things happened. It's the vital signs monitor for your actual
      code.
    </p>

    <!-- Feature Highlights -->
    <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
      {#each benefits as benefit}
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
        class="ld-card-base rounded-3xl p-8 transition-all hover:-translate-y-1 hover:shadow-lg"
        href="/features/logging"
        data-posthog-id="feature-metrics-other-logging"
      >
        <div
          class="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"
        >
          <LogsIcon class="h-6 w-6" />
        </div>
        <h3 class="mb-2 text-2xl font-bold">Logging</h3>
        <p class="opacity-80">Unify your logs from every source.</p>
      </a>
      <a
        class="ld-card-base rounded-3xl p-8 transition-all hover:-translate-y-1 hover:shadow-lg"
        href="/features/monitoring"
        data-posthog-id="feature-metrics-other-monitoring"
      >
        <div
          class="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"
        >
          <HeartPulseIcon class="h-6 w-6" />
        </div>
        <h3 class="mb-2 text-2xl font-bold">Monitoring</h3>
        <p class="opacity-80">Sleep well with simple uptime alerts.</p>
      </a>
    </div>
  </section>

  <div class="distance h-16"></div>

  <Footer />
</AnimatedView>
