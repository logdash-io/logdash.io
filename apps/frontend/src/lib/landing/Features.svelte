<script>
  import { FEATURES } from '$lib/domains/shared/constants/features.js';
  import { RoutePath } from '$lib/domains/shared/route-path.js';
  import { ArrowRightIcon, TimerIcon } from 'lucide-svelte';
</script>

<div class="container mx-auto max-w-7xl px-4 gap-8">
  <header class="mb-16 text-center">
    <h1 class="mb-4 text-4xl font-bold tracking-tight">
      Overwhelmingly simple.
    </h1>

    <p class="text-base-content/70 mx-auto max-w-3xl text-xl">
      We do the heavy lifting so you can focus on your business. Improve
      reliability and understand your SaaS with one simple tool.
    </p>
  </header>

  <section
    class="mb-16 max-w-5xl mx-auto grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
  >
    {#each FEATURES as feature (feature.id)}
      <div class="ld-card-base group overflow-hidden rounded-3xl p-2">
        <div class="w-full p-6">
          <div class="mb-6 text-5xl">
            <feature.icon class="text-primary h-10 w-10" />
          </div>
          <h2 class="card-title mb-4 text-2xl">
            {feature.title}
          </h2>
          <p class="text-base-content/70">
            {feature.description}
          </p>
        </div>

        <div class="p-6">
          <ul class="list-disc space-y-2 pl-5">
            {#each feature.benefits as benefit}
              <li class="text-base-content/80">
                {benefit}
              </li>
            {/each}
          </ul>

          {#if feature.available}
            <a
              href={`/features/${feature.slug}`}
              class="btn btn-md hover:btn-primary btn-secondary mt-6 w-full"
              data-posthog-id={`features-${feature.id}-learn-more-cta`}
            >
              Learn more
              <ArrowRightIcon class="size-4" />
            </a>
          {:else}
            <button class="btn btn-md btn-secondary mt-6 w-full" disabled>
              Coming soon
              <TimerIcon class="size-4" />
            </button>
          {/if}
        </div>
      </div>
    {/each}
  </section>

  <section class="text-center">
    <h2 class="mb-1 text-3xl font-bold">
      Join founders sleeping soundly tonight.
    </h2>
    <p class="text-base-content/70 mb-4">
      No credit card required. Create your account and get your first signals in
      minutes.
    </p>
    <a
      class="btn btn-primary"
      data-posthog-id="features-open-dashboard-cta"
      href={RoutePath.AUTH}
    >
      Start free
    </a>
  </section>
</div>
