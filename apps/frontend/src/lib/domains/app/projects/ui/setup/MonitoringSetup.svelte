<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { monitoringState } from '$lib/domains/app/projects/application/monitoring.state.svelte.js';
  import { MonitorMode } from '$lib/domains/app/projects/domain/monitoring/monitor-mode.js';
  import MonitorsListener from '$lib/domains/app/projects/ui/presentational/PingsListener.svelte';
  import { autoFocus } from '$lib/domains/shared/ui/actions/use-autofocus.svelte.js';
  import DataTile from '$lib/domains/shared/ui/components/DataTile.svelte';
  import CancelSetupButton from '$lib/domains/shared/ui/setup/CancelSetupButton.svelte';
  import { toast } from '$lib/domains/shared/ui/toaster/toast.state.svelte.js';
  import { stripProtocol } from '$lib/domains/shared/utils/url.js';
  import { envConfig, StatusBar } from '@logdash/hyper-ui';
  import { Tooltip } from '@logdash/hyper-ui/presentational';
  import { CheckCircle, CopyIcon } from 'lucide-svelte';
  import { onMount, type Snippet } from 'svelte';
  import { match, P } from 'ts-pattern';

  type Props = {
    project_id: string;
    claimer: Snippet<[boolean]>;
    onMonitorCreated?: (monitorId: string) => void;
  };
  const { project_id, claimer, onMonitorCreated }: Props = $props();
  const MIN_NAME_LENGTH = 1;
  const MAX_NAME_LENGTH = 50;

  const clusterId = $derived(page.params.cluster_id);
  const observedUrl = $derived(
    decodeURIComponent(page.url.searchParams.get('url') || ''),
  );
  const nameParam = $derived(
    decodeURIComponent(page.url.searchParams.get('name') || ''),
  );
  const modeParam = $derived(page.url.searchParams.get('mode') as MonitorMode);
  const monitorMode = $derived(modeParam || MonitorMode.PULL);
  let monitorId = $state<string | undefined>();

  const monitorName = $derived(
    stripProtocol(decodeURIComponent(nameParam || observedUrl || '')),
  );

  const isHealthy = $derived(
    monitorId ? monitoringState.hasSuccessfulPing(monitorId) : false,
  );
  const pings = $derived.by(() =>
    monitorId
      ? monitoringState.monitoringPings(monitorId).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
      : [],
  );
  const PINGS_VISIBLE = 80;

  $effect(() => {
    if (monitorName === decodeURIComponent(nameParam || '')) {
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

    monitoringState
      .createMonitor(project_id, {
        projectId: project_id,
        name: monitorName,
        mode: monitorMode,
        url: monitorMode === MonitorMode.PULL ? observedUrl : undefined,
      })
      .then((createdMonitorId) => {
        monitorId = createdMonitorId;
        onMonitorCreated?.(createdMonitorId);
        monitoringState.sync(clusterId);
      });

    return () => {
      monitoringState.unsync();
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

  function onCopyEndpoint(): void {
    if (!monitorId) {
      toast.error('Monitor not found');
      return;
    }

    const endpoint = `${envConfig.apiBaseUrl}/ping/${monitorId}`;
    navigator.clipboard.writeText(endpoint);
    toast.success('Endpoint copied to clipboard');
  }
</script>

<div class="w-xl mr-auto space-y-8">
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

      <div class="space-y-1">
        <p class="text-xs opacity-60">Latest pings</p>

        <div class="flex w-full flex-row justify-end overflow-hidden">
          {#each Array(PINGS_VISIBLE) as _, index}
            {@const ping = pings[PINGS_VISIBLE - index - 1]}
            {@const isHealthy =
              ping?.statusCode >= 200 && ping?.statusCode < 400}
            {@const isUnknown = ping === undefined}
            {@const pingStatus = isHealthy
              ? 'healthy'
              : isUnknown
                ? 'unknown'
                : 'unhealthy'}

            <Tooltip content={`${ping?.createdAt} ${index}`} placement="top">
              <StatusBar status={pingStatus} />
            </Tooltip>
          {/each}
        </div>
      </div>
    </div>
  </DataTile>
</div>

<div class="fixed left-0 top-0 z-50 h-full w-full bg-black/10">
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
        {#if monitorMode === MonitorMode.PULL}
          <span>2. Integration instructions</span>
        {:else}
          <span>3. Capture pings</span>
        {/if}
      </div>

      <div class="text-sm">
        {#if monitorMode === MonitorMode.PULL}
          <MonitorsListener onCaptureOnce={() => {}} {monitorId}>
            <div class="flex items-center justify-start gap-2 font-semibold">
              <CheckCircle class="text-success h-5 w-5" />
              <span class="text-success opacity-80">
                Pings captured successfully!
              </span>
            </div>
          </MonitorsListener>
        {:else if monitorId}
          <div class="space-y-4">
            <div class="bg-base-100 space-y-4 rounded-lg p-4">
              <p class="text-sm opacity-80">
                Your service will send status updates to this monitor. Use the
                following endpoint:
              </p>
              <code
                class="bg-base-200 text-primary block rounded p-2 font-mono text-xs"
              >
                POST {envConfig.apiBaseUrl}/ping/{monitorId}
              </code>
              <button
                onclick={onCopyEndpoint}
                class="btn btn-sm btn-secondary gap-1"
              >
                <CopyIcon class="h-3 w-3" />
                Copy endpoint
              </button>
            </div>
            <div class="flex items-center justify-start gap-2 font-semibold">
              <CheckCircle class="text-success h-5 w-5" />
              <span class="text-success opacity-80">
                Ready to receive pings from your service!
              </span>
            </div>
          </div>
        {:else}
          <div class="flex items-center justify-start gap-2 font-semibold">
            <div class="loading loading-spinner loading-xs"></div>
            <span>Preparing monitor...</span>
          </div>
        {/if}
      </div>
    </div>

    <div class="mt-auto flex w-full flex-col items-center gap-4">
      {@render claimer(isHealthy)}

      <CancelSetupButton id="monitoring" {clusterId} projectId={project_id} />
    </div>
  </div>
</div>
