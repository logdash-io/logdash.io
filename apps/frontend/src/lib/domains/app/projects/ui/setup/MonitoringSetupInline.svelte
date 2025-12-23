<script lang="ts">
  import { page } from '$app/state';
  import { monitoringState } from '$lib/domains/app/projects/application/monitoring.state.svelte.js';
  import { MonitorMode } from '$lib/domains/app/projects/domain/monitoring/monitor-mode.js';
  import MonitorsListener from '$lib/domains/app/projects/ui/presentational/PingsListener.svelte';
  import { autoFocus } from '$lib/domains/shared/ui/actions/use-autofocus.svelte.js';
  import { toast } from '$lib/domains/shared/ui/toaster/toast.state.svelte.js';
  import { envConfig } from '$lib/domains/shared/utils/env-config';
  import {
    isValidUrl,
    stripProtocol,
    tryPrependProtocol,
  } from '$lib/domains/shared/utils/url.js';
  import { userState } from '$lib/domains/shared/user/application/user.state.svelte.js';
  import { PingChart } from '@logdash/hyper-ui/features';
  import { Tooltip } from '@logdash/hyper-ui/presentational';
  import { CheckCircle, CopyIcon, CheckIcon } from 'lucide-svelte';
  import { onMount } from 'svelte';

  type Props = {
    projectId: string;
  };
  const { projectId }: Props = $props();

  const MIN_NAME_LENGTH = 3;
  const MAX_NAME_LENGTH = 800;
  const CHECK_INTERVAL_MS = 15000;
  const PINGS_VISIBLE = 80;

  const clusterId = $derived(page.params.cluster_id);

  let selectedMode = $state<MonitorMode>(MonitorMode.PULL);
  let url = $state('');
  let monitorName = $state('');
  let monitorId = $state<string | undefined>();
  let isCreating = $state(false);

  const urlValid = $derived(isValidUrl(url));
  const isFormValid = $derived(
    selectedMode === MonitorMode.PULL
      ? urlValid
      : monitorName.length >= MIN_NAME_LENGTH,
  );
  const canUsePush = $derived(userState.isPro);

  const isHealthy = $derived(
    monitorId ? monitoringState.hasSuccessfulPing(monitorId) : false,
  );
  const pings = $derived.by(() =>
    monitorId
      ? monitoringState.monitoringPings(monitorId).slice(-PINGS_VISIBLE)
      : [],
  );

  let nowMs = $state(Date.now());
  const nextCheckInMs = $derived(
    CHECK_INTERVAL_MS - (nowMs % CHECK_INTERVAL_MS),
  );
  const nextCheckInSeconds = $derived(Math.ceil(nextCheckInMs / 1000));
  const checkProgressFraction = $derived(
    (CHECK_INTERVAL_MS - nextCheckInMs) / CHECK_INTERVAL_MS,
  );

  onMount(() => {
    let raf = 0;
    const loop = () => {
      nowMs = Date.now();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
    };
  });

  async function onCreateMonitor(): Promise<void> {
    if (!isFormValid || isCreating) return;

    isCreating = true;

    const finalUrl =
      selectedMode === MonitorMode.PULL ? tryPrependProtocol(url) : undefined;
    const finalName =
      selectedMode === MonitorMode.PULL
        ? stripProtocol(finalUrl || '')
        : monitorName;

    const createdMonitorId = await monitoringState.createMonitor(projectId, {
      projectId,
      name: finalName,
      mode: selectedMode,
      url: finalUrl,
    });

    monitorId = createdMonitorId;
    monitoringState.sync(clusterId);
    isCreating = false;
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

<div class="mx-auto flex w-full max-w-2xl flex-col gap-6">
  {#if !monitorId}
    <div class="space-y-2">
      <h5 class="text-2xl font-semibold">Setup Monitoring for your service</h5>

      <p class="text-base-content opacity-60">
        Monitor your services uptime and get alerted when they go down.
      </p>
    </div>

    <div class="space-y-4">
      <div class="tabs tabs-boxed tabs-sm w-fit">
        <button
          class={[
            'tab px-4',
            { 'tab-active bg-base-100': selectedMode === MonitorMode.PULL },
          ]}
          onclick={() => (selectedMode = MonitorMode.PULL)}
          type="button"
        >
          Pull (HTTP check)
        </button>
        {#if canUsePush}
          <button
            class={[
              'tab px-4',
              { 'tab-active bg-base-100': selectedMode === MonitorMode.PUSH },
            ]}
            onclick={() => (selectedMode = MonitorMode.PUSH)}
            type="button"
          >
            Push (Heartbeat)
          </button>
        {:else}
          <Tooltip
            content="Upgrade to Pro to use Push monitors"
            placement="bottom"
          >
            <button
              class={[
                'tab px-4',
                {
                  'tab-active bg-base-100': selectedMode === MonitorMode.PUSH,
                  'opacity-60 cursor-not-allowed': true,
                },
              ]}
              disabled={true}
              type="button"
            >
              Push (Heartbeat)
            </button>
          </Tooltip>
        {/if}
      </div>

      <div class="space-y-2">
        {#if selectedMode === MonitorMode.PULL}
          <label class="label font-medium">URL to monitor</label>
          <input
            bind:value={url}
            minlength={MIN_NAME_LENGTH}
            maxlength={MAX_NAME_LENGTH}
            class="input input-bordered w-full"
            placeholder="https://example.com/health"
            use:autoFocus={{ delay: 100 }}
          />
          <p class="text-xs opacity-60">
            We'll ping this URL every 15 seconds to check if your service is up.
          </p>
        {:else}
          <label class="label font-medium">Monitor name</label>
          <input
            bind:value={monitorName}
            minlength={MIN_NAME_LENGTH}
            maxlength={MAX_NAME_LENGTH}
            class="input input-bordered w-full"
            placeholder="My Backend Service"
            use:autoFocus={{ delay: 100 }}
          />
          <p class="text-xs opacity-60">
            Your service will send heartbeat pings to our endpoint.
          </p>
        {/if}
      </div>

      <button
        class="btn btn-primary"
        disabled={!isFormValid || isCreating}
        onclick={onCreateMonitor}
      >
        {#if isCreating}
          <span class="loading loading-spinner loading-sm"></span>
        {:else}
          <CheckIcon class="h-4 w-4" />
        {/if}
        Create Monitor
      </button>
    </div>
  {:else}
    <div class="space-y-2">
      <h5 class="text-2xl font-semibold">Monitor Created</h5>

      <div class="flex items-center gap-2">
        <span class="text-lg font-medium">
          {selectedMode === MonitorMode.PULL ? stripProtocol(url) : monitorName}
        </span>
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
    </div>

    <div class="space-y-1">
      <p class="text-xs opacity-60">Latest pings</p>
      <PingChart
        maxPingsToShow={PINGS_VISIBLE}
        pings={pings.map((ping) => ({
          ...ping,
          createdAt: ping.createdAt.toISOString(),
        }))}
      />
    </div>

    {#if selectedMode === MonitorMode.PULL}
      <div class="bg-base-100 space-y-3 rounded-lg p-4">
        <div class="flex items-center justify-between">
          <span class="text-sm opacity-80">Checks every 15s</span>
          <span class="text-xs opacity-60">
            Next check in {nextCheckInSeconds}s
          </span>
        </div>
        <progress
          class="progress progress-secondary h-2 w-full"
          max="1"
          value={checkProgressFraction}
        ></progress>
      </div>

      <MonitorsListener onCaptureOnce={() => {}} {monitorId}>
        <div class="flex items-center justify-start gap-2 font-semibold">
          <CheckCircle class="text-success h-5 w-5" />
          <span class="text-success opacity-80">
            Pings captured successfully!
          </span>
        </div>
      </MonitorsListener>
    {:else}
      <div class="bg-base-100 space-y-4 rounded-lg p-4">
        <p class="text-sm opacity-80">
          Your service should send status updates to this endpoint:
        </p>
        <code
          class="bg-base-200 text-primary block rounded p-2 font-mono text-xs"
        >
          POST {envConfig.apiBaseUrl}/ping/{monitorId}
        </code>
        <button onclick={onCopyEndpoint} class="btn btn-sm btn-secondary gap-1">
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
    {/if}
  {/if}
</div>
