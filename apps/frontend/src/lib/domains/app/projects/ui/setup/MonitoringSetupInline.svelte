<script lang="ts">
  import { monitoringState } from '$lib/domains/app/projects/application/monitoring.state.svelte.js';
  import { projectsState } from '$lib/domains/app/projects/application/projects.state.svelte.js';
  import { MonitorMode } from '$lib/domains/app/projects/domain/monitoring/monitor-mode.js';
  import { readHttpErrorStatus } from '$lib/domains/shared/http/http-error.js';
  import { autoFocus } from '$lib/domains/shared/ui/actions/use-autofocus.svelte.js';
  import { toast } from '$lib/domains/shared/ui/toaster/toast.state.svelte.js';
  import { envConfig } from '$lib/domains/shared/utils/env-config';
  import {
    isValidUrl,
    tryPrependProtocol,
  } from '$lib/domains/shared/utils/url.js';
  import { userState } from '$lib/domains/shared/user/application/user.state.svelte.js';
  import MonitorUrlField from './MonitorUrlField.svelte';
  import {
    Button,
    Input,
    Label,
    Spinner,
    Tab,
    Tabs,
    Tooltip,
  } from '@logdash/hyper-ui/presentational';
  import CopyIcon from '$lib/domains/shared/icons/CopyIcon.svelte';
  import IconButton from '$lib/domains/shared/ui/components/IconButton.svelte';
  import {
    SETTINGS_INPUT_CLASS,
    SETTINGS_PAGE_CLASS,
    SETTINGS_PANEL_CLASS,
    SettingsCardHeader,
  } from '$lib/domains/shared/ui/components/settings-card/index.js';
  import { untrack } from 'svelte';
  import { fromAction } from 'svelte/attachments';

  type Props = {
    clusterId: string;
    projectId: string;
  };
  const { clusterId, projectId }: Props = $props();

  const MAX_NAME_LENGTH = 255;
  const MONITOR_LIMIT_MESSAGE =
    'Too many monitors waiting to be set up. Try again in a few minutes.';

  let selectedMode = $state<MonitorMode>(MonitorMode.PULL);
  let url = $state('');
  let monitorName = $derived.by(() => {
    const serviceId = projectId;

    return untrack(() => projectsState.projectName(serviceId));
  });
  let isSubmitting = $state(false);
  let pendingMonitorId = $state<string | undefined>();

  const urlValid = $derived(isValidUrl(url.trim()));
  const nameValid = $derived(monitorName.trim().length > 0);
  const isFormValid = $derived(
    selectedMode === MonitorMode.PULL
      ? urlValid && nameValid
      : nameValid && Boolean(pendingMonitorId),
  );
  const canUsePush = $derived(userState.isPro);
  const pushEndpoint = $derived(
    pendingMonitorId ? `${envConfig.apiBaseUrl}/ping/${pendingMonitorId}` : '',
  );
  let isCreatingPushMonitor = $state(false);

  $effect(() => {
    if (selectedMode !== MonitorMode.PUSH) return;
    if (!nameValid) return;

    untrack(() => {
      if (pendingMonitorId || isCreatingPushMonitor) return;
      void createPushMonitor();
    });
  });

  async function createPushMonitor(): Promise<void> {
    isCreatingPushMonitor = true;
    try {
      const createdMonitorId = await monitoringState.createMonitor(projectId, {
        projectId,
        name: monitorName.trim(),
        mode: MonitorMode.PUSH,
        url: undefined,
      });
      pendingMonitorId = createdMonitorId;
    } catch (error) {
      toast.error(
        readHttpErrorStatus(error) === 409
          ? MONITOR_LIMIT_MESSAGE
          : 'Failed to create monitor',
      );
    } finally {
      isCreatingPushMonitor = false;
    }
  }

  function onSubmit(event: SubmitEvent): void {
    event.preventDefault();
    void finishSetup();
  }

  async function finishSetup(): Promise<void> {
    if (!isFormValid || isSubmitting) return;

    isSubmitting = true;

    try {
      if (selectedMode === MonitorMode.PUSH) {
        await finishPushSetup();
      } else {
        await finishPullSetup();
      }

      await monitoringState.sync(clusterId);
    } catch (error) {
      toast.error(
        readHttpErrorStatus(error) === 409
          ? MONITOR_LIMIT_MESSAGE
          : 'Failed to setup monitoring',
      );
      isSubmitting = false;
    }
  }

  async function finishPushSetup(): Promise<void> {
    if (!pendingMonitorId) {
      throw new Error('Push monitor is not ready yet');
    }

    const pendingMonitor =
      monitoringState.getUnclaimedMonitor(pendingMonitorId);

    if (pendingMonitor && pendingMonitor.name !== monitorName.trim()) {
      await monitoringState.updateMonitor(pendingMonitorId, {
        name: monitorName.trim(),
      });
    }

    await monitoringState.claimMonitor(pendingMonitorId);
  }

  async function finishPullSetup(): Promise<void> {
    const createdMonitorId = await monitoringState.createMonitor(projectId, {
      projectId,
      name: monitorName.trim(),
      mode: MonitorMode.PULL,
      url: tryPrependProtocol(url.trim()),
    });

    await monitoringState.claimMonitor(createdMonitorId);
  }

  async function onCopyEndpoint(): Promise<void> {
    if (!pushEndpoint) {
      toast.error('Monitor not found');
      return;
    }

    await navigator.clipboard.writeText(pushEndpoint);
    toast.success('Endpoint copied to clipboard');
  }
</script>

<form class={[SETTINGS_PAGE_CLASS, 'gap-3!']} onsubmit={onSubmit}>
  <SettingsCardHeader
    title="Set up monitoring"
    description="Check that this service is up and get alerted when it goes down."
  />

  <div
    class={['flex min-w-0 flex-col items-start gap-5', SETTINGS_PANEL_CLASS]}
  >
    <Tabs size="sm" class="w-fit">
      <Tab
        class="px-4"
        active={selectedMode === MonitorMode.PULL}
        onclick={() => (selectedMode = MonitorMode.PULL)}
      >
        Pull (we ping you)
      </Tab>
      {#if canUsePush}
        <Tab
          class="px-4"
          active={selectedMode === MonitorMode.PUSH}
          onclick={() => (selectedMode = MonitorMode.PUSH)}
        >
          Push (you ping us)
        </Tab>
      {:else}
        <Tooltip
          content="Upgrade to Pro to use Push monitors"
          placement="bottom"
        >
          <Tab
            class="text-fg-faint pointer-events-auto cursor-not-allowed px-4 opacity-100"
            active={selectedMode === MonitorMode.PUSH}
            disabled={true}
          >
            Push (you ping us)
          </Tab>
        </Tooltip>
      {/if}
    </Tabs>

    {#if selectedMode === MonitorMode.PULL}
      <div class="flex w-full flex-col gap-2">
        <MonitorUrlField
          id="monitor-url"
          {projectId}
          bind:value={url}
          size="sm"
          inputClass={SETTINGS_INPUT_CLASS}
          autofocus
        />
        <p class="text-fg-muted text-xs">
          Checked every 5 minutes on the free plan, every 15 seconds on Pro.
        </p>
      </div>

      <div class="flex w-full flex-col gap-2">
        <Label class="text-xs text-fg-muted" for="monitor-name-pull">
          Monitor name
        </Label>
        <Input
          id="monitor-name-pull"
          bind:value={monitorName}
          maxlength={MAX_NAME_LENGTH}
          size="sm"
          class={['w-full', SETTINGS_INPUT_CLASS]}
          placeholder="My API service"
        />
      </div>
    {:else}
      <div class="flex w-full flex-col gap-2">
        <Label class="text-xs text-fg-muted" for="monitor-name-push">
          Monitor name
        </Label>
        <Input
          id="monitor-name-push"
          bind:value={monitorName}
          maxlength={MAX_NAME_LENGTH}
          size="sm"
          class={['w-full', SETTINGS_INPUT_CLASS]}
          placeholder="My backend service"
          {@attach fromAction(autoFocus, () => ({ delay: 100 }))}
        />
        <p class="text-fg-muted text-xs">
          Your service will send heartbeat pings to our endpoint.
        </p>
      </div>

      {#if isCreatingPushMonitor}
        <div class="text-fg-muted flex items-center gap-2 text-sm">
          <Spinner size="xs" aria-hidden="true" />
          Generating endpoint
        </div>
      {:else if pushEndpoint}
        <div class="flex w-full flex-col gap-2">
          <span class="text-fg-muted text-xs">Ping endpoint</span>
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
            Send a POST request to this URL from your service.
          </p>
        </div>
      {/if}
    {/if}

    <Button
      type="submit"
      variant="primary"
      size="sm"
      disabled={!isFormValid || isSubmitting}
      loading={isSubmitting}
    >
      Start monitoring
    </Button>
  </div>
</form>
