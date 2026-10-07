<script lang="ts">
  import { clustersState } from '$lib/domains/app/clusters/application/clusters.state.svelte.js';
  import { monitoringState } from '$lib/domains/app/projects/application/monitoring.state.svelte.js';
  import { MonitorMode } from '$lib/domains/app/projects/domain/monitoring/monitor-mode.js';
  import MonitorUrlField from '$lib/domains/app/projects/ui/setup/MonitorUrlField.svelte';
  import CopyIcon from '$lib/domains/shared/icons/CopyIcon.svelte';
  import { exposedConfigState } from '$lib/domains/shared/exposed-config/application/exposed-config.state.svelte.js';
  import { readHttpErrorStatus } from '$lib/domains/shared/http/http-error.js';
  import { autoFocus } from '$lib/domains/shared/ui/actions/use-autofocus.svelte.js';
  import IconButton from '$lib/domains/shared/ui/components/IconButton.svelte';
  import SegmentedControl from '$lib/domains/shared/ui/components/SegmentedControl.svelte';
  import { SETTINGS_INPUT_CLASS } from '$lib/domains/shared/ui/components/settings-card/index.js';
  import { toast } from '$lib/domains/shared/ui/toaster/toast.state.svelte.js';
  import { upgradeState } from '$lib/domains/shared/upgrade/upgrade.state.svelte.js';
  import { previewNameFromUrl } from '$lib/domains/shared/utils/address-names.js';
  import { envConfig } from '$lib/domains/shared/utils/env-config';
  import {
    isValidUrl,
    tryPrependProtocol,
  } from '$lib/domains/shared/utils/url.js';
  import {
    Button,
    Input,
    Label,
    Spinner,
  } from '@logdash/hyper-ui/presentational';
  import { untrack } from 'svelte';
  import { fromAction } from 'svelte/attachments';

  type Props = {
    clusterId: string;
    oncreated: (monitorId: string) => void;
  };

  const { clusterId, oncreated }: Props = $props();

  const MAX_NAME_LENGTH = 255;

  let mode = $state<MonitorMode>(MonitorMode.PULL);
  let url = $state('');
  let typedName = $state<string | null>(null);
  let isSubmitting = $state(false);
  let isCreatingPushMonitor = $state(false);
  let pendingMonitorId = $state<string | undefined>();

  const canCreatePushMonitors = $derived(
    exposedConfigState.canCreatePushMonitors(
      clustersState.get(clusterId)?.tier,
    ),
  );
  const pushTier = $derived(exposedConfigState.firstTierWithPushMonitors());
  const modes = $derived([
    { value: MonitorMode.PULL, label: 'We check a URL' },
    {
      value: MonitorMode.PUSH,
      label: 'You send heartbeats',
      badge:
        canCreatePushMonitors || !pushTier
          ? undefined
          : exposedConfigState.formatTierName(pushTier),
    },
  ]);
  const urlValid = $derived(isValidUrl(url.trim()));
  const suggestedName = $derived(
    urlValid ? previewNameFromUrl(tryPrependProtocol(url.trim())) : '',
  );
  const name = $derived(typedName ?? suggestedName);
  const nameValid = $derived(name.trim().length > 0);
  const isFormValid = $derived(
    mode === MonitorMode.PULL
      ? urlValid && nameValid
      : nameValid && Boolean(pendingMonitorId),
  );
  const pushEndpoint = $derived(
    pendingMonitorId ? `${envConfig.apiBaseUrl}/ping/${pendingMonitorId}` : '',
  );

  $effect(() => {
    if (mode !== MonitorMode.PUSH || !nameValid) {
      return;
    }

    untrack(() => {
      if (!pendingMonitorId && !isCreatingPushMonitor) {
        void createPushMonitor();
      }
    });
  });

  function onNameInput(
    event: Event & { currentTarget: HTMLInputElement },
  ): void {
    typedName = event.currentTarget.value;
  }

  function onModeChange(next: MonitorMode): void {
    if (next === MonitorMode.PUSH && !canCreatePushMonitors) {
      upgradeState.openModal('push-monitors', pushTier);
      return;
    }

    mode = next;
  }

  async function createPushMonitor(): Promise<void> {
    isCreatingPushMonitor = true;

    try {
      pendingMonitorId = await monitoringState.createMonitor(clusterId, {
        name: name.trim(),
        mode: MonitorMode.PUSH,
      });
    } catch (error) {
      onError(error);
    } finally {
      isCreatingPushMonitor = false;
    }
  }

  async function onSubmit(event: SubmitEvent): Promise<void> {
    event.preventDefault();

    if (!isFormValid || isSubmitting) {
      return;
    }

    isSubmitting = true;

    try {
      const monitorId =
        mode === MonitorMode.PUSH ? await finishPush() : await finishPull();
      await monitoringState.claimMonitor(monitorId);
      oncreated(monitorId);
    } catch (error) {
      onError(error);
      isSubmitting = false;
    }
  }

  async function finishPush(): Promise<string> {
    const monitorId = pendingMonitorId!;

    if (monitoringState.getUnclaimedMonitor(monitorId)?.name !== name.trim()) {
      await monitoringState.updateMonitor(monitorId, { name: name.trim() });
    }

    return monitorId;
  }

  function finishPull(): Promise<string> {
    return monitoringState.createMonitor(clusterId, {
      name: name.trim(),
      mode: MonitorMode.PULL,
      url: tryPrependProtocol(url.trim()),
    });
  }

  function onError(error: unknown): void {
    if (readHttpErrorStatus(error) === 409) {
      upgradeState.openModal('monitor-limit');
      return;
    }

    toast.error('Failed to add the monitor');
  }

  async function onCopyEndpoint(): Promise<void> {
    await navigator.clipboard.writeText(pushEndpoint);
    toast.success('Endpoint copied to clipboard');
  }
</script>

<form class="flex min-w-0 flex-col gap-5" onsubmit={onSubmit}>
  <SegmentedControl
    label="Monitor type"
    options={modes}
    value={mode}
    onChange={onModeChange}
  />

  {#if mode === MonitorMode.PULL}
    <div class="flex flex-col gap-2">
      <MonitorUrlField
        id="monitor-url"
        {clusterId}
        bind:value={url}
        size="sm"
        inputClass={SETTINGS_INPUT_CLASS}
        autofocus
      />
      <p class="text-fg-muted text-xs">
        Checked every 5 minutes on the free plan, every 15 seconds on Pro.
      </p>
    </div>
  {/if}

  <div class="flex flex-col gap-2">
    <Label class="text-xs text-fg-muted" for="monitor-name">Name</Label>
    <Input
      id="monitor-name"
      value={name}
      oninput={onNameInput}
      maxlength={MAX_NAME_LENGTH}
      size="sm"
      class={['w-full', SETTINGS_INPUT_CLASS]}
      placeholder={mode === MonitorMode.PULL ? 'acme.com' : 'Nightly backup'}
      {@attach fromAction(autoFocus, () => ({
        delay: 100,
        enabled: mode === MonitorMode.PUSH,
      }))}
    />
  </div>

  {#if mode === MonitorMode.PUSH}
    {#if isCreatingPushMonitor}
      <div class="text-fg-muted flex items-center gap-2 text-sm">
        <Spinner size="xs" aria-hidden="true" />
        Generating endpoint
      </div>
    {:else if pushEndpoint}
      <div class="flex flex-col gap-2">
        <span class="text-fg-muted text-xs">Heartbeat endpoint</span>
        <div class="flex items-center gap-2">
          <code
            class="bg-surface-50-bg flex h-8 min-w-0 flex-1 items-center truncate rounded-lg px-2.5 font-mono text-sm edge"
          >
            {pushEndpoint}
          </code>
          <IconButton label="Copy endpoint" onclick={onCopyEndpoint}>
            <CopyIcon class="size-4" />
          </IconButton>
        </div>
        <p class="text-fg-muted text-xs">
          Send a POST request to it from your job. No request in time marks it
          down.
        </p>
      </div>
    {/if}
  {/if}

  <Button
    type="submit"
    variant="primary"
    size="sm"
    class="self-start"
    disabled={!isFormValid || isSubmitting}
    loading={isSubmitting}
  >
    Start monitoring
  </Button>
</form>
