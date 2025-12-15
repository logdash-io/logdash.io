<script lang="ts">
  import AnimatedView from '$lib/domains/shared/ui/AnimatedView.svelte';
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

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Logdash Monitoring',
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Cloud',
    description:
      'Your silent partner. Simple uptime monitoring that lets you sleep without worrying about your app going down.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };
</script>

<SeoMeta
  title="Uptime Monitoring | Logdash"
  description="Your silent partner. Simple uptime monitoring that lets you sleep without worrying about your app going down. 24/7 checks and instant alerts."
  keywords="uptime monitoring, website monitoring, server status, downtime alerts, logdash monitoring"
  {jsonLd}
/>

<AnimatedView class="mx-auto flex w-full max-w-7xl flex-col">
  <!-- Centralized Hero Section -->
  <section class="mx-auto w-full max-w-4xl px-6 pb-16 pt-24 text-center">
    <div class="mb-8 flex justify-center">
      <div class="flex items-center gap-3">
        <Icon class="text-primary h-12 w-12" />
      </div>
    </div>

    <h1 class="mb-6 text-4xl font-extrabold tracking-tight md:text-6xl">
      Silent partner watching your back when you sleep
    </h1>

    <p
      class="text-base-content/70 mx-auto mb-10 max-w-2xl text-xl leading-relaxed"
    >
      Relax on refreshing your own website. We monitor your uptime <span
        class="font-mono text-base-content font-semibold text-base"
      >
        24/7/365
      </span>
      and alert you the moment something goes wrong, so you can focus on building.
    </p>

    <div class="flex flex-col items-center justify-center gap-4 sm:flex-row">
      <a
        href={RoutePath.AUTH}
        class="btn btn-primary w-full sm:w-auto"
        data-posthog-id="feature-monitoring-cta"
      >
        Start monitoring
        <ArrowRightIcon class="ml-1 size-4" />
      </a>
      <a
        href="/demo-dashboard"
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
      <h2 class="mb-6 text-3xl font-bold md:text-4xl">The Fear of Silence</h2>
      <div class="flex flex-col gap-8 md:flex-row md:gap-12">
        <div class="flex-1">
          <p class="text-lg leading-relaxed opacity-80">
            There is a specific kind of anxiety when you launch a product. You
            check your phone every hour. Is it working? Did the server crash? Is
            the database up?
          </p>
          <p class="mt-4 text-lg leading-relaxed opacity-80">
            You shouldn't have to live like that. You need a system that taps
            you on the shoulder only when it's important, so you can actually
            enjoy your dinner.
          </p>
        </div>
        <div class="flex-1">
          <h3 class="mb-4 text-xl font-semibold">Peace of mind means...</h3>
          <ul class="space-y-4">
            <li class="flex items-start gap-3 opacity-90">
              <span class="text-success mt-1">✓</span>
              <span>Not refreshing your own website to see if it loads.</span>
            </li>
            <li class="flex items-start gap-3 opacity-90">
              <span class="text-success mt-1">✓</span>
              <span>
                Knowing you'll get a Telegram message instantly if it breaks.
              </span>
            </li>
            <li class="flex items-start gap-3 opacity-90">
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
    <h2 class="mb-6 text-3xl font-bold md:text-4xl">
      We poke it so you don't have to.
    </h2>
    <p class="mx-auto mb-12 max-w-3xl text-xl opacity-80">
      We just ping your endpoints. If they don't answer, we let you know. It's
      that simple. No complex configuration, just reliable eyes on your work.
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
        data-posthog-id="feature-monitoring-other-logging"
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
        href="/features/metrics"
        data-posthog-id="feature-monitoring-other-metrics"
      >
        <div
          class="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"
        >
          <ChartSplineIcon class="h-6 w-6" />
        </div>
        <h3 class="mb-2 text-2xl font-bold">Metrics</h3>
        <p class="opacity-80">Track system health and performance.</p>
      </a>
    </div>
  </section>

  <div class="distance h-16"></div>

  <Footer />
</AnimatedView>
