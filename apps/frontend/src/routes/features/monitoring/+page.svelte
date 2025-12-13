<script lang="ts">
  import AnimatedView from '$lib/domains/shared/ui/AnimatedView.svelte';
  import Footer from '$lib/landing/Footer.svelte';
  import { FEATURES } from '$lib/domains/shared/constants/features.js';
  import { RoutePath } from '$lib/domains/shared/route-path.js';
  import { ArrowRightIcon } from 'lucide-svelte';

  const feature = FEATURES.find((f) => f.slug === 'monitoring') ?? FEATURES[0];
  const Icon = feature.icon;
</script>

<svelte:head>
  <title>Monitoring | Logdash</title>
  <meta
    name="description"
    content="Get simple uptime monitoring and alerts so you know when your app is down before customers do."
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
          Monitoring that lets you sleep
        </h1>

        <p class="max-w-2xl text-lg leading-relaxed opacity-80">
          Don’t wait for customers to tell you something is down. Logdash gives
          you simple uptime checks and clear alerts so you can react fast and
          stay calm.
        </p>

        <div class="flex flex-col gap-3 sm:flex-row">
          <a
            href={RoutePath.AUTH}
            class="btn btn-primary w-full sm:w-fit"
            data-posthog-id="feature-monitoring-cta"
          >
            Get started for free
            <ArrowRightIcon class="ml-1 h-5 w-5" />
          </a>
          <a
            href="/demo-dashboard"
            class="btn btn-secondary w-full sm:w-fit"
            data-posthog-id="feature-monitoring-demo-cta"
          >
            See the live demo
          </a>
        </div>
      </div>

      <div class="ld-card-base w-full max-w-md p-6">
        <h2 class="mb-3 text-xl font-bold">Perfect for moments like</h2>
        <ul class="list-disc space-y-2 pl-5 opacity-90">
          <li>A customer asks “is it down?” and you have no idea</li>
          <li>A scheduled job stops running and nobody notices</li>
          <li>You want peace of mind after deploying</li>
        </ul>
      </div>
    </div>
  </section>

  <section class="mx-auto w-full max-w-5xl px-6 py-10">
    <h2 class="mb-4 text-3xl font-bold">What you get</h2>
    <div class="ld-card-base rounded-xl p-8">
      <p class="mb-6 text-lg opacity-80">
        Monitoring in Logdash is designed to be straightforward and reliable.
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
        data-posthog-id="feature-monitoring-other-logging"
      >
        <h3 class="mb-2 text-2xl font-semibold">Logging</h3>
        <p class="opacity-80">Get quick answers when something breaks.</p>
      </a>
      <a
        class="ld-card-base rounded-xl p-6 transition-shadow hover:shadow-lg"
        href="/features/metrics"
        data-posthog-id="feature-monitoring-other-metrics"
      >
        <h3 class="mb-2 text-2xl font-semibold">Metrics</h3>
        <p class="opacity-80">Track trends and catch regressions early.</p>
      </a>
    </div>
  </section>

  <div class="distance h-16"></div>

  <Footer />
</AnimatedView>
