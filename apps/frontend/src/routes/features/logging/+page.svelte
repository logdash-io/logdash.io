<script lang="ts">
  import AnimatedView from '$lib/domains/shared/ui/AnimatedView.svelte';
  import Footer from '$lib/landing/Footer.svelte';
  import { FEATURES } from '$lib/domains/shared/constants/features.js';
  import { RoutePath } from '$lib/domains/shared/route-path.js';
  import {
    ArrowRightIcon,
    ChartSplineIcon,
    HeartPulseIcon,
    LayersIcon,
    SearchIcon,
    TagIcon,
  } from 'lucide-svelte';

  const feature = FEATURES.find((f) => f.slug === 'logging') ?? FEATURES[0];
  const Icon = feature.icon;

  const benefits = [
    {
      text: feature.benefits[0],
      icon: LayersIcon,
    },
    {
      text: feature.benefits[1],
      icon: SearchIcon,
    },
    {
      text: feature.benefits[2],
      icon: TagIcon,
    },
  ];
</script>

<svelte:head>
  <title>Logging | Logdash</title>
  <meta
    name="description"
    content="Stop tab-switching to find bugs. Logdash unifies logs from all your sources into one simple, searchable stream."
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
      Unified logging with the fastest search on the planet
    </h1>

    <p
      class="text-base-content/70 mx-auto mb-10 max-w-2xl text-xl leading-relaxed"
    >
      Your logs are scattered everywhere. Vercel, Supabase, Cloudflare... it's
      tough. No more tab switching to find out what happened.
    </p>

    <div class="flex flex-col items-center justify-center gap-4 sm:flex-row">
      <a
        href={RoutePath.AUTH}
        class="btn btn-primary w-full sm:w-auto"
        data-posthog-id="feature-logging-cta"
      >
        Unify your logs
        <ArrowRightIcon class="ml-1 size-4" />
      </a>
      <a
        href="/demo-dashboard"
        class="btn btn-secondary w-full sm:w-auto"
        data-posthog-id="feature-logging-demo-cta"
      >
        See the live demo
      </a>
    </div>
  </section>

  <!-- Deep-Dive Problem Section -->
  <section class="mx-auto w-full max-w-5xl px-6 py-16">
    <div class="ld-card-base rounded-3xl p-8 md:p-12">
      <h2 class="mb-6 text-3xl font-bold md:text-4xl">The "Alt-Tab" Fatigue</h2>
      <div class="flex flex-col gap-8 md:flex-row md:gap-12">
        <div class="flex-1">
          <p class="text-lg leading-relaxed opacity-80">
            You know the drill. A user reports a bug. You check Vercel for the
            BFF/Backend logs. Then you switch to Supabase to check the DB logs.
            Then you check your payment provider's dashboard.
          </p>
          <p class="mt-4 text-lg leading-relaxed opacity-80">
            By the time you find the issue, you've lost 20 minutes and your flow
            is gone. Context switching kills your productivity. You need one
            stream for everything.
          </p>
        </div>
        <div class="flex-1">
          <h3 class="mb-4 text-xl font-semibold">The scattered reality</h3>
          <ul class="space-y-4">
            <li class="flex items-start gap-3 opacity-90">
              <span class="text-error mt-1">✕</span>
              <span>Logs are scattered across different dashboards.</span>
            </li>
            <li class="flex items-start gap-3 opacity-90">
              <span class="text-error mt-1">✕</span>
              <span>
                You have to mentally correlate timestamps across 3 different
                tools.
              </span>
            </li>
            <li class="flex items-start gap-3 opacity-90">
              <span class="text-error mt-1">✕</span>
              <span>
                You miss the root cause because it was hidden in a "third party"
                log.
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
      One Stream. Complete Clarity.
    </h2>
    <p class="mx-auto mb-12 max-w-3xl text-xl opacity-80">
      We pipe everything into one searchable feed. Filter by user_id across your
      entire stack. See the request that caused the crash. It's how debugging
      should feel.
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
        href="/features/metrics"
        data-posthog-id="feature-logging-other-metrics"
      >
        <div
          class="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"
        >
          <ChartSplineIcon class="h-6 w-6" />
        </div>
        <h3 class="mb-2 text-2xl font-bold">Metrics</h3>
        <p class="opacity-80">Track system health and performance.</p>
      </a>
      <a
        class="ld-card-base rounded-3xl p-8 transition-all hover:-translate-y-1 hover:shadow-lg"
        href="/features/monitoring"
        data-posthog-id="feature-logging-other-monitoring"
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
