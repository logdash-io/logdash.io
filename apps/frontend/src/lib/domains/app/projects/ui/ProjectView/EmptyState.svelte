<script>
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import SetupMonitoringButton from '$lib/domains/app/projects/ui/presentational/SetupMonitoringButton.svelte';
  import DataTile from '$lib/domains/app/projects/ui/ProjectView/tiles/DataTile.svelte';
  import { FEATURES } from '$lib/domains/shared/constants/features.ts';
  import FlamingoIcon from '$lib/domains/shared/icons/FlamingoIcon.svelte';
  import { Feature } from '$lib/domains/shared/types.ts';
  import { userState } from '$lib/domains/shared/user/application/user.state.svelte.ts';
  import { ArrowRightIcon, TimerIcon } from 'lucide-svelte';
  import { cubicInOut } from 'svelte/easing';
  import { fade } from 'svelte/transition';
</script>

<div class="flex w-full flex-col gap-4 sm:flex-row">
  <div
    class="ld-card flex h-fit w-full flex-col gap-4 rounded-2xl text-center sm:w-2/5"
    in:fade={{ easing: cubicInOut, duration: 300 }}
  >
    <h5 class="text-2xl font-semibold">Where features?</h5>

    <div class="p-6 xl:p-14">
      <FlamingoIcon
        class="pointer-events-none aspect-square w-full rounded-2xl object-cover select-none"
      />
    </div>

    <span class="text-base-content text-center opacity-80">
      Your service is ready… but no features are enabled.
    </span>
  </div>

  <div class="flex w-full flex-col gap-4 sm:w-3/5">
    {#each FEATURES as feature, i}
      <DataTile class="group" delayIn={i * 15}>
        <div
          class="text-secondary/60 group-hover:text-secondary flex flex-col items-start justify-between gap-4 transition-all"
        >
          <div class="text-secondary flex w-full items-center justify-between">
            <h5 class="text-2xl font-semibold">
              {feature.title}
            </h5>

            {#if feature.id === Feature.MONITORING}
              <SetupMonitoringButton
                class="btn btn-primary btn-sm gap-1 opacity-90"
                canAddMore={true}
                onSubmit={(url) => {
                  goto(
                    `/app/clusters/${page.params.cluster_id}/configure/monitoring?project_id=${page.url.searchParams.get(
                      'project_id',
                    )}&url=${encodeURIComponent(url)}`,
                  );
                }}
              >
                Setup monitoring
                <ArrowRightIcon class="h-4 w-4" />
              </SetupMonitoringButton>
            {:else}
              <button
                class="btn btn-primary btn-sm gap-1 opacity-90"
                disabled={!feature.available}
                onclick={() => {
                  if (!feature.available) {
                    return;
                  }

                  goto(
                    `/app/clusters/${page.params.cluster_id}/configure/${feature.id}?project_id=${page.url.searchParams.get(
                      'project_id',
                    )}`,
                  );
                }}
              >
                {#if !feature.available}
                  Coming soon
                  <TimerIcon class="h-4 w-4" />
                {:else}
                  Setup {feature.title}
                  <ArrowRightIcon class="h-4 w-4" />
                {/if}
              </button>
            {/if}
          </div>

          <ul>
            {#each feature.benefits as benefit}
              <li class="flex items-center gap-2">
                <ArrowRightIcon
                  class="group-hover:text-primary text-secondary h-4 w-4 transition-all"
                />
                {benefit}
              </li>
            {/each}
          </ul>
        </div>
      </DataTile>
    {/each}
  </div>
</div>
