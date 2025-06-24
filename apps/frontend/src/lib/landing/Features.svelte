<script>
  import { goto } from '$app/navigation';
  import SetupMonitoringButton from '$lib/clusters/projects/ui/presentational/SetupMonitoringButton.svelte';
  import { FEATURES } from '$lib/shared/constants/features.js';
  import { RoutePath } from '$lib/shared/route-path.js';
  import { Feature } from '$lib/shared/types.js';
  import { isDev } from '$lib/shared/utils/is-dev.util.js';
  import { ArrowRightIcon, TimerIcon } from 'lucide-svelte';
</script>

<div class="container mx-auto max-w-7xl px-4 py-8">
  <header class="mb-16 text-center">
    <h1 class="mb-4 text-4xl font-bold tracking-tight lg:text-5xl">
      Platform Features
    </h1>

    <p class="text-base-content/70 mx-auto max-w-3xl text-xl">
      Everything you need to improve reliability and understand your
      mission-critical systems, infrastructure in one simple platform.
    </p>
  </header>

  <section class="mb-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
    {#each FEATURES as feature (feature.id)}
      <div
        class="ld-card-base group overflow-hidden rounded-xl p-2 shadow-lg transition-all duration-300 hover:shadow-xl"
      >
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

        <div
          class="to-primary/15 mt-4 rounded-lg border border-[#2b0b1a] bg-gradient-to-br from-transparent p-6"
        >
          <ul class="list-disc space-y-2 pl-5">
            {#each feature.benefits as benefit}
              <li class="text-base-content/80">
                {benefit}
              </li>
            {/each}
          </ul>

          {#if feature.id !== Feature.MONITORING}
            <a
              {...feature.available && {
                href: `${RoutePath.QUICK_SETUP}?feature=${feature.id}`,
              }}
              class="btn btn-md hover:btn-primary btn-secondary trnasition-none mt-6 w-full"
              data-posthog-id={`features-${feature.id}-cta`}
              aria-disabled={!feature.available}
            >
              {#if !feature.available}
                Coming soon
                <TimerIcon class="h-5 w-5" />
              {:else}
                Quick Setup
                <ArrowRightIcon class="h-5 w-5" />
              {/if}
            </a>
          {:else}
            <SetupMonitoringButton
              class="btn btn-md hover:btn-primary btn-secondary trnasition-none mt-6 w-full"
              canAddMore={true}
              onSubmit={(url) => {
                goto(
                  `${RoutePath.QUICK_SETUP}?feature=${feature.id}&url=${encodeURIComponent(url)}`,
                );
              }}
            >
              Setup monitoring
              <ArrowRightIcon class="h-4 w-4" />
            </SetupMonitoringButton>
          {/if}
        </div>
      </div>
    {/each}
  </section>

  <section class="ld-card-base rounded-xl p-8">
    <h2 class="mb-1 text-3xl font-bold">Ready to take it for a spin?</h2>
    <p class="text-base-content/70 mb-4">
      No credit card required. Understand your system in minutes, like never
      before.
    </p>
    <a
      class="btn btn-primary"
      data-posthog-id="features-open-dashboard-cta"
      href={RoutePath.AUTH}
    >
      Open dashboard
    </a>
  </section>
</div>
