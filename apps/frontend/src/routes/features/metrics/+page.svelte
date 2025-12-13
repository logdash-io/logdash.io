<script lang="ts">
  import AnimatedView from '$lib/domains/shared/ui/AnimatedView.svelte';
  import Footer from '$lib/landing/Footer.svelte';
  import { FEATURES } from '$lib/domains/shared/constants/features.js';
  import { RoutePath } from '$lib/domains/shared/route-path.js';
  import { ArrowRightIcon } from 'lucide-svelte';

  const feature = FEATURES.find((f) => f.slug === 'metrics') ?? FEATURES[0];
  const Icon = feature.icon;
</script>

<svelte:head>
  <title>Metrics | Logdash</title>
  <meta
    name="description"
    content="Track the numbers that matter for your app and business. Spot trends early and make better decisions, without a complicated setup."
  />
</svelte:head>

<AnimatedView class="mx-auto flex w-full max-w-7xl flex-col">
  <section class="mx-auto w-full max-w-5xl px-6 pb-10 pt-14">
    <div
      class="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between"
    >
      <div class="flex flex-col gap-6">
        <div class="flex items-center gap-3">
          <Icon class="text-primary h-10 w-10" />
          <span class="badge badge-xs font-mono text-xs opacity-70">
            feature
          </span>
        </div>

        <h1 class="text-4xl font-extrabold tracking-tight md:text-5xl">
          Metrics that show if your business is healthy
        </h1>

        <p class="max-w-2xl text-lg leading-relaxed opacity-80">
          When you ship fast, you need to know what changed. Logdash turns your
          most important numbers into simple charts so you can catch issues and
          stay on track.
        </p>

        <div class="flex flex-col gap-3 sm:flex-row">
          <a
            href={RoutePath.AUTH}
            class="btn btn-primary w-full sm:w-fit"
            data-posthog-id="feature-metrics-cta"
          >
            Get started for free
            <ArrowRightIcon class="ml-1 h-5 w-5" />
          </a>
          <a
            href="/demo-dashboard"
            class="btn btn-secondary w-full sm:w-fit"
            data-posthog-id="feature-metrics-demo-cta"
          >
            See the live demo
          </a>
        </div>
      </div>

      <div class="ld-card-base w-full max-w-md p-6">
        <h2 class="mb-3 text-xl font-bold">Perfect for moments like</h2>
        <ul class="list-disc space-y-2 pl-5 opacity-90">
          <li>You ship a change and want to see impact on signups</li>
          <li>Latency creeps up and conversions quietly drop</li>
          <li>
            You want a daily pulse without building dashboards from scratch
          </li>
        </ul>
      </div>
    </div>
  </section>

  <section class="mx-auto w-full max-w-5xl px-6 py-10">
    <h2 class="mb-4 text-3xl font-bold">What you get</h2>
    <div class="ld-card-base rounded-xl p-8">
      <p class="mb-6 text-lg opacity-80">
        Metrics in Logdash are built to be simple, useful, and actionable.
      </p>
      <ul class="list-disc space-y-3 pl-5 text-lg">
        {#each feature.benefits as benefit}
          <li class="opacity-90">{benefit}</li>
        {/each}
      </ul>
    </div>
  </section>

  <section class="mx-auto w-full max-w-5xl px-6 py-10">
    <h2 class="mb-4 text-3xl font-bold">Explore other features</h2>
    <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
      <a
        class="ld-card-base rounded-xl p-6 transition-shadow hover:shadow-lg"
        href="/features/logging"
        data-posthog-id="feature-metrics-other-logging"
      >
        <h3 class="mb-2 text-2xl font-semibold">Logging</h3>
        <p class="opacity-80">Find the root cause fast with searchable logs.</p>
      </a>
      <a
        class="ld-card-base rounded-xl p-6 transition-shadow hover:shadow-lg"
        href="/features/monitoring"
        data-posthog-id="feature-metrics-other-monitoring"
      >
        <h3 class="mb-2 text-2xl font-semibold">Monitoring</h3>
        <p class="opacity-80">Get alerts when your app is down or degrading.</p>
      </a>
    </div>
  </section>

  <div class="distance h-16"></div>

  <Footer />
</AnimatedView>
