<script lang="ts">
  import { monitoringState } from '$lib/domains/app/projects/application/monitoring.state.svelte.js';
  import {
    dismissCatchAllWarning,
    isCatchAllWarningDismissed,
    probeUrl,
  } from '$lib/domains/app/projects/application/url-probe.js';
  import { MonitorMode } from '$lib/domains/app/projects/domain/monitoring/monitor-mode.js';
  import type { Monitor } from '$lib/domains/app/projects/domain/monitoring/monitor.js';
  import {
    withPath,
    type UrlProbe,
  } from '$lib/domains/app/projects/domain/monitoring/url-hint.js';
  import { createLogger } from '$lib/domains/shared/logger';
  import { toast } from '$lib/domains/shared/ui/toaster/toast.state.svelte.js';
  import { urlPath } from '$lib/domains/shared/utils/url.js';
  import { Button } from '@logdash/hyper-ui/presentational';
  import { CloseIcon, DangerIcon } from '@logdash/hyper-ui/icons';

  type Props = {
    monitor: Monitor;
    onEdit: () => void;
  };

  const { monitor, onEdit }: Props = $props();

  const logger = createLogger('catch-all-callout', false);

  let probed = $state<{ url: string; probe: UrlProbe } | null>(null);
  let dismissedMonitorId = $state<string | null>(null);
  let savingPath = $state<string | null>(null);

  const rootUrl = $derived(
    monitor.mode === MonitorMode.PULL &&
      monitor.url &&
      urlPath(monitor.url) === '/'
      ? monitor.url
      : null,
  );
  const isDismissed = $derived(
    dismissedMonitorId === monitor.id || isCatchAllWarningDismissed(monitor.id),
  );
  const probe = $derived(
    rootUrl && probed?.url === rootUrl ? probed.probe : null,
  );

  $effect(() => {
    const url = rootUrl;

    if (!url || isDismissed) {
      return;
    }

    void loadProbe(url);
  });

  async function loadProbe(url: string): Promise<void> {
    try {
      probed = { url, probe: await probeUrl(monitor.projectId, url) };
    } catch (error) {
      logger.debug('URL probe failed', error);
    }
  }

  async function onUseHealthPath(path: string): Promise<void> {
    if (!rootUrl) {
      return;
    }

    savingPath = path;

    try {
      await monitoringState.updateMonitor(monitor.id, {
        url: withPath(rootUrl, path),
      });
      toast.success(`Now checking ${path}`, 5000);
    } catch {
      toast.error('Failed to update the monitor', 5000);
    } finally {
      savingPath = null;
    }
  }

  function onDismiss(): void {
    dismissCatchAllWarning(monitor.id);
    dismissedMonitorId = monitor.id;
  }
</script>

{#if probe?.catchAll && !isDismissed}
  <div class="flex gap-3" role="status">
    <DangerIcon class="text-warning mt-0.5 size-4 shrink-0" />

    <div class="flex min-w-0 flex-1 flex-col gap-3">
      <div class="flex flex-col gap-0.5 text-sm">
        <p class="text-warning">
          This host answers every path with the same page
        </p>
        <p class="text-fg-muted text-pretty">
          A check here only proves the host is up, not that your app works.
          {#if probe.healthPaths.length === 0}
            Point it at a health endpoint if your app has one.
          {/if}
        </p>
      </div>

      <div class="flex flex-wrap gap-2">
        {#each probe.healthPaths as path (path)}
          <Button
            size="sm"
            loading={savingPath === path}
            disabled={savingPath !== null && savingPath !== path}
            onclick={() => onUseHealthPath(path)}
          >
            Use <span class="font-mono">{path}</span>
          </Button>
        {:else}
          <Button size="sm" onclick={onEdit}>Edit monitor</Button>
        {/each}
      </div>
    </div>

    <Button
      variant="ghost"
      size="xs"
      shape="square"
      class="-mt-1 -mr-1"
      aria-label="Dismiss"
      onclick={onDismiss}
    >
      <CloseIcon class="size-3.5" />
    </Button>
  </div>
{/if}
