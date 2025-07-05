<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { monitoringState } from '$lib/domains/app/projects/application/monitoring.state.svelte.js';
  import DataTile from '$lib/domains/shared/ui/components/DataTile.svelte';
  import { autoFocus } from '$lib/domains/shared/ui/actions/use-autofocus.svelte.js';
  import Tooltip from '$lib/domains/shared/ui/components/Tooltip.svelte';
  import { stripProtocol } from '$lib/domains/shared/utils/url.js';
  import { CheckCircle } from 'lucide-svelte';
  import { onMount, type Snippet } from 'svelte';
  import MonitorsListener from '$lib/domains/app/projects/ui/presentational/PingsListener.svelte';
  import { browser } from '$app/environment';

  type Props = {
    project_id: string;
    claimer: Snippet<[boolean]>;
  };
  const { project_id, claimer }: Props = $props();
  const MIN_NAME_LENGTH = 1;
  const MAX_NAME_LENGTH = 50;

  const clusterId = $derived(page.params.cluster_id);
  const observedUrl = $derived(page.url.searchParams.get('url'));
  const nameParam = $derived(page.url.searchParams.get('name'));
  const monitorName = $derived(
    stripProtocol(decodeURIComponent(nameParam || observedUrl)),
  );
  const isHealthy = $derived(monitoringState.isPreviewHealthy(observedUrl));
  const pings = $derived.by(() => monitoringState.previewPings(observedUrl));

  $effect(() => {
    monitoringState.previewUrl(clusterId, observedUrl);

    return () => {
      monitoringState.stopUrlPreview();
    };
  });

  $effect(() => {
    if (monitorName === nameParam) {
      return;
    }

    setMonitorName(monitorName);
  });

  onMount(() => {
    const t = setTimeout(() => {
      if (!nameParam) {
        setMonitorName(stripProtocol(observedUrl));
      }
    }, 0);

    return () => {
      clearTimeout(t);
    };
  });

  function setMonitorName(name: string) {
    const query = new URLSearchParams(page.url.searchParams.toString());

    query.set('name', encodeURIComponent(name));

    goto(`?${query.toString()}`, {
      replaceState: true,
      keepFocus: true,
      noScroll: true,
    });
  }
</script>

<div class="mr-auto w-xl space-y-8">
  <DataTile delayIn={0} delayOut={50}>
    <div class="flex w-full flex-col gap-2">
      <div class="flex w-full gap-2">
        <div class="flex w-full items-center gap-2">
          <h5 class="truncate text-2xl font-semibold">
            {monitorName}
          </h5>

          <div
            class={[
              'badge badge-soft',
              {
                'badge-success': isHealthy,
                'badge-error': !isHealthy,
              },
            ]}
          >
            <span
              class={[
                'status',
                {
                  'status-success': isHealthy,
                  'status-error': !isHealthy,
                },
              ]}
            ></span>
            {isHealthy ? 'up' : 'down'}
          </div>
        </div>

        <span class="loading loading-ring loading-sm duration-1000"></span>
      </div>

      <div class="flex w-full flex-col gap-1">
        <div
          class="flex h-12 w-full items-center justify-end gap-1 overflow-hidden lg:gap-1"
        >
          {#each Array.from({ length: 60 - pings.length }) as _, i}
            <div
              class={[
                'h-8 w-1.5 shrink-0 rounded-sm hover:h-12 lg:w-[7px]',
                {
                  'bg-gradient-to-b from-neutral-700 via-neutral-700/80 to-neutral-700': true,
                  'bg-warning': false,
                },
              ]}
            ></div>
          {/each}

          {#each pings as ping, i}
            {@const pingHealthy =
              ping.statusCode >= 200 && ping.statusCode < 400}
            <Tooltip content={`Service is up ${i}`} placement="top">
              <div
                class={[
                  'h-8 w-1.5 shrink-0 rounded-sm bg-gradient-to-b hover:h-12 lg:w-[7px]',
                  {
                    'from-green-600 via-green-600/80 to-green-600': pingHealthy,
                    'from-red-600 via-red-600/80 to-red-600': !pingHealthy,
                  },
                ]}
              ></div>
            </Tooltip>
          {/each}
        </div>
      </div>
    </div>
  </DataTile>
</div>

<div class="flexx hiddxen fixed top-0 left-0 z-50 h-full w-full bg-black/60">
  <div
    class="bg-base-200 absolute top-0 right-0 mx-auto flex h-full w-full max-w-2xl flex-col gap-4 overflow-auto p-6 sm:w-xl sm:p-8"
  >
    <div class="space-y-2">
      <h5 class="text-2xl font-semibold">Setup Monitoring for your service</h5>

      <p class="text-base-content opacity-60">
        Add url and monitor your service. Your dashboard will update
        automatically as we send pings.
      </p>
    </div>

    <div class="collapse-open collapse overflow-visible rounded-none">
      <div class="px-1 py-4 font-semibold">
        <span>1. Configure url</span>
      </div>

      <span class="text-secondary relative truncate text-3xl font-semibold">
        {observedUrl}
      </span>
    </div>

    <div class="collapse-open collapse overflow-visible rounded-none">
      <div class="px-1 py-4 font-semibold">
        <span>2. Choose name</span>
      </div>

      <div class="space-y-2 text-3xl font-semibold">
        <input
          class="input-sm input-ghost selection:bg-secondary/20 border-secondary/20 focus:border-primary h-full w-full rounded-lg border px-3 py-2 text-lg font-semibold outline-0 focus:bg-transparent"
          maxlength={MAX_NAME_LENGTH}
          minlength={MIN_NAME_LENGTH}
          oninput={(e) => {
            setMonitorName(e.currentTarget.value);
          }}
          placeholder={stripProtocol(observedUrl)}
          type="text"
          use:autoFocus={{
            selectAll: true,
          }}
          value={monitorName}
        />
      </div>
    </div>

    <div class="collapse-open">
      <div class="px-1 py-4 font-semibold">
        <span>3. Capture pings</span>
      </div>

      <div class="text-sm">
        <MonitorsListener onCaptureOnce={() => {}} url={observedUrl}>
          <div class="flex items-center justify-start gap-2 font-semibold">
            <CheckCircle class="text-success h-5 w-5" />
            <span class="text-success opacity-80">
              Pings captured successfully!
            </span>
          </div>
        </MonitorsListener>
      </div>
    </div>

    <div class="flex items-center gap-4">
      <button
        class="btn btn-secondary btn-soft flex-1 whitespace-nowrap"
        data-posthog-id="public-dashboard-setup-back-button"
        onclick={() => {
          goto(
            `/app/clusters/${page.params.cluster_id}?project_id=${project_id}`,
            {
              invalidateAll: true,
            },
          );
        }}
      >
        Cancel
      </button>

      {@render claimer(isHealthy)}
    </div>
  </div>
</div>
