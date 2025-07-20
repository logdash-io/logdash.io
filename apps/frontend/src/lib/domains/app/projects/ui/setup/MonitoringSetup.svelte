<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { monitoringState } from '$lib/domains/app/projects/application/monitoring.state.svelte.js';
  import DataTile from '$lib/domains/shared/ui/components/DataTile.svelte';
  import { autoFocus } from '$lib/domains/shared/ui/actions/use-autofocus.svelte.js';
  import { Tooltip } from '@logdash/hyper-ui/presentational';
  import { stripProtocol } from '$lib/domains/shared/utils/url.js';
  import { CheckCircle } from 'lucide-svelte';
  import { onMount, type Snippet } from 'svelte';
  import MonitorsListener from '$lib/domains/app/projects/ui/presentational/PingsListener.svelte';
  import { browser } from '$app/environment';
  import CancelSetupButton from '$lib/domains/shared/ui/setup/CancelSetupButton.svelte';
  import { MonitorMode } from '$lib/domains/app/projects/domain/monitoring/monitor-mode.js';

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
  const modeParam = $derived(page.url.searchParams.get('mode') as MonitorMode);
  const monitorMode = $derived(modeParam || MonitorMode.PULL);

  const monitorName = $derived(
    stripProtocol(decodeURIComponent(nameParam || observedUrl || '')),
  );

  // Only use preview functionality for pull mode
  const isHealthy = $derived(
    monitorMode === MonitorMode.PULL
      ? monitoringState.isPreviewHealthy(observedUrl)
      : true,
  );
  const pings = $derived.by(() =>
    monitorMode === MonitorMode.PULL
      ? monitoringState.previewPings(observedUrl)
      : [],
  );

  $effect(() => {
    if (monitorMode === MonitorMode.PULL && observedUrl) {
      monitoringState.previewUrl(clusterId, observedUrl);
    }

    return () => {
      if (monitorMode === MonitorMode.PULL) {
        monitoringState.stopUrlPreview();
      }
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
      if (!nameParam && observedUrl) {
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

<<<<<<< Updated upstream
<div class="w-xl mr-auto space-y-8">
  <DataTile delayIn={0} delayOut={50}>
    <div class="flex w-full flex-col gap-2">
      <div class="flex w-full gap-2">
        <div class="flex w-full items-center gap-2">
          <h5 class="truncate text-2xl font-semibold">
            {monitorName}
          </h5>
=======
{#if monitorMode === MonitorMode.PULL}
  <div class="w-xl mr-auto space-y-8">
    <DataTile delayIn={0} delayOut={50}>
      <div class="flex w-full flex-col gap-2">
        <div class="flex w-full gap-2">
          <div class="flex w-full items-center gap-2">
            <h5 class="truncate text-2xl font-semibold">
              {monitorName}
            </h5>
>>>>>>> Stashed changes

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

        <div class="space-y-1">
          <p class="text-xs opacity-60">Latest pings</p>

          <div class="flex w-full flex-row gap-0.5">
            {#each Array(100) as _, index}
              {@const ping = pings[index]}
              {@const pingHealthy = ping
                ? ping.statusCode >= 200 && ping.statusCode < 400
                : false}

              <div
                class={[
                  'h-5 w-1 rounded-sm',
                  {
                    'bg-success': pingHealthy,
                    'bg-error': ping && !pingHealthy,
                    'bg-base-200': !ping,
                  },
                ]}
              ></div>
            {/each}
          </div>
        </div>
      </div>
    </DataTile>
  </div>
{/if}

<<<<<<< Updated upstream
<div class="fixed left-0 top-0 z-50 h-full w-full bg-black/40">
=======
<div class="fixed left-0 top-0 z-50 h-full w-full bg-black/10">
>>>>>>> Stashed changes
  <div
    class="bg-base-200 sm:w-xl absolute right-0 top-0 mx-auto flex h-full w-full max-w-2xl flex-col gap-4 overflow-auto p-6 sm:p-8 sm:pb-6"
  >
    <div class="space-y-2">
      <h5 class="text-2xl font-semibold">
        Setup {monitorMode === MonitorMode.PULL ? 'Pull' : 'Push'} Monitoring for
        your service
      </h5>

      <p class="text-base-content opacity-60">
        {#if monitorMode === MonitorMode.PULL}
          Add URL and monitor your service. Your dashboard will update
          automatically as we send pings.
        {:else}
          Create a monitor that listens for pings from your service. Your
          dashboard will update when you send status updates.
        {/if}
      </p>
    </div>

    {#if monitorMode === MonitorMode.PULL}
      <div class="collapse-open collapse overflow-visible rounded-none">
        <div class="px-1 py-4 font-semibold">
          <span>1. Configure URL</span>
        </div>

        <span class="text-secondary relative truncate text-3xl font-semibold">
          {observedUrl}
        </span>
      </div>
    {/if}

    <div class="collapse-open collapse overflow-visible rounded-none">
      <div class="px-1 py-4 font-semibold">
        <span>{monitorMode === MonitorMode.PULL ? '2' : '1'}. Choose name</span>
      </div>

      <div class="space-y-2 text-3xl font-semibold">
        <input
          class="input-sm input-ghost selection:bg-secondary/20 border-secondary/20 focus:border-primary h-full w-full rounded-lg border px-3 py-2 text-lg font-semibold outline-0 focus:bg-transparent"
          maxlength={MAX_NAME_LENGTH}
          minlength={MIN_NAME_LENGTH}
          oninput={(e) => {
            setMonitorName(e.currentTarget.value);
          }}
          placeholder={monitorMode === MonitorMode.PULL
            ? stripProtocol(observedUrl || '')
            : 'My Service Monitor'}
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
        <span>
          {monitorMode === MonitorMode.PULL ? '3' : '2'}.
          {monitorMode === MonitorMode.PULL
            ? 'Capture pings'
            : 'Integration instructions'}
        </span>
      </div>

      <div class="text-sm">
        {#if monitorMode === MonitorMode.PULL}
          <MonitorsListener onCaptureOnce={() => {}} url={observedUrl}>
            <div class="flex items-center justify-start gap-2 font-semibold">
              <CheckCircle class="text-success h-5 w-5" />
              <span class="text-success opacity-80">
                Pings captured successfully!
              </span>
            </div>
          </MonitorsListener>
        {:else}
          <div class="space-y-4">
            <div class="bg-base-100 rounded-lg p-4">
              <p class="mb-2 text-sm opacity-80">
                Your service will send status updates to this monitor. Use the
                following endpoint:
              </p>
              <code class="bg-base-200 text-primary block rounded p-2 text-xs">
                POST /api/monitors/{'{monitor_id}'}/ping
              </code>
            </div>
            <div class="flex items-center justify-start gap-2 font-semibold">
              <CheckCircle class="text-success h-5 w-5" />
              <span class="text-success opacity-80">
                Ready to receive pings from your service!
              </span>
            </div>
          </div>
        {/if}
      </div>
    </div>

    <div class="mt-auto flex w-full flex-col items-center gap-4">
      {@render claimer(monitorMode === MonitorMode.PUSH || isHealthy)}

      <CancelSetupButton id="monitoring" {clusterId} projectId={project_id} />
    </div>
  </div>
</div>
