<script lang="ts">
  import { clustersState } from '$lib/domains/app/clusters/application/clusters.state.svelte.js';
  import Modal from '$lib/domains/shared/ui/Modal.svelte';
  import { toast } from '$lib/domains/shared/ui/toaster/toast.state.svelte.js';
  import CopyIcon from '$lib/domains/shared/icons/CopyIcon.svelte';
  import KeyIcon from '$lib/domains/shared/icons/KeyIcon.svelte';
  import { CheckIcon, CloseIcon } from '@logdash/hyper-ui/icons';
  import SegmentedControl from '$lib/domains/shared/ui/components/SegmentedControl.svelte';
  import {
    Button,
    Checkbox,
    Input,
    Select,
  } from '@logdash/hyper-ui/presentational';
  import {
    cliAuthErrorMessage,
    type CliAuthRequest,
  } from '../domain/cli-auth.js';
  import {
    ACTION_LABELS,
    DEFAULT_SCOPES,
    EXPIRY_OPTIONS,
    RESOURCES,
    type AccessRestriction,
    type Action,
    type CreatedPersonalApiKey,
    type Resource,
    type ScopeEntry,
  } from '../domain/personal-api-key.js';

  type Props = {
    isOpen: boolean;
    onClose: () => void;
    mode?: 'manage' | 'cli';
    cliRequest?: CliAuthRequest | null;
    onCreated?: () => void;
  };

  let {
    isOpen,
    onClose,
    mode = 'manage',
    cliRequest = null,
    onCreated,
  }: Props = $props();

  let label = $state('');
  let scopes = $state<ScopeEntry[]>(DEFAULT_SCOPES);
  let accessKind = $state<AccessRestriction['kind'] | null>(null);
  let selectedClusterIds = $state<string[]>([]);
  let selectedProjectIds = $state<string[]>([]);
  let expiryDays = $state<number | null>(90);

  let submitting = $state(false);
  let createdValue = $state<string | null>(null);
  let cliResult = $state<'approved' | 'denied' | null>(null);
  let loadingClusters = false;

  const scopeRows = RESOURCES.map((row) => ({
    ...row,
    options: row.actions.map((action) => ({
      value: action,
      label: ACTION_LABELS[action],
    })),
  }));

  const accessOptions: { value: AccessRestriction['kind']; label: string }[] = [
    { value: 'all', label: 'Everything' },
    { value: 'clusters', label: 'Domains' },
    { value: 'projects', label: 'Services' },
  ];

  const clusters = $derived(clustersState.clusters);
  const hasAccessTargets = $derived(
    accessKind === 'all' ||
      (accessKind === 'clusters' && selectedClusterIds.length > 0) ||
      (accessKind === 'projects' && selectedProjectIds.length > 0),
  );
  const canDeleteMonitors = $derived(scopeAction('monitors') === 'delete');
  const clustersWithProjects = $derived(
    clustersState.clusters.filter(
      (cluster) => (cluster.projects ?? []).length > 0,
    ),
  );

  $effect(() => {
    if (isOpen && !clustersState.ready) {
      void loadClusters();
    }
  });

  async function loadClusters(): Promise<void> {
    if (loadingClusters) {
      return;
    }
    loadingClusters = true;
    try {
      await clustersState.load();
    } catch (cause) {
      console.error(cause);
    } finally {
      loadingClusters = false;
    }
  }

  function setScope(resource: Resource, action: Action): void {
    scopes = RESOURCES.map((row) => ({
      resource: row.resource,
      action: row.resource === resource ? action : scopeAction(row.resource),
    })).filter((entry) => entry.action !== 'none');
  }

  function scopeAction(resource: Resource): Action {
    return (
      scopes.find((entry) => entry.resource === resource)?.action ?? 'none'
    );
  }

  function toggleCluster(id: string): void {
    selectedClusterIds = selectedClusterIds.includes(id)
      ? selectedClusterIds.filter((value) => value !== id)
      : [...selectedClusterIds, id];
  }

  function toggleProject(id: string): void {
    selectedProjectIds = selectedProjectIds.includes(id)
      ? selectedProjectIds.filter((value) => value !== id)
      : [...selectedProjectIds, id];
  }

  function buildAccess(): AccessRestriction {
    if (accessKind === 'clusters') {
      return { kind: 'clusters', ids: selectedClusterIds };
    }
    if (accessKind === 'projects') {
      return { kind: 'projects', ids: selectedProjectIds };
    }
    return { kind: 'all' };
  }

  function formatTimestamp(value: string): string {
    return new Date(value).toLocaleString();
  }

  function close(): void {
    label = '';
    scopes = DEFAULT_SCOPES;
    accessKind = null;
    selectedClusterIds = [];
    selectedProjectIds = [];
    expiryDays = 90;
    createdValue = null;
    cliResult = null;
    onClose();
  }

  async function onSubmit(): Promise<void> {
    if (mode === 'manage' && label.trim() === '') {
      toast.warning('Enter a label for this key', 5000);
      return;
    }

    if (!hasAccessTargets) {
      toast.warning('Choose what this key is allowed to reach', 5000);
      return;
    }

    submitting = true;

    try {
      if (mode === 'cli') {
        const response = await fetch('/app/api/user/cli-auth/approve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userCode: cliRequest?.userCode,
            scopes,
            access: buildAccess(),
          }),
        });

        if (!response.ok) {
          toast.error(cliAuthErrorMessage(response.status), 5000);
          return;
        }

        cliResult = 'approved';
      } else {
        const response = await fetch('/app/api/user/personal-api-keys', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            label: label.trim(),
            scopes,
            access: buildAccess(),
            expiresAt:
              expiryDays === null
                ? undefined
                : new Date(Date.now() + expiryDays * 86_400_000).toISOString(),
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create key');
        }

        const data = (await response.json()) as CreatedPersonalApiKey;
        createdValue = data.value;
        onCreated?.();
      }
    } catch (error) {
      toast.error(
        mode === 'cli'
          ? 'Failed to approve the request'
          : 'Failed to create the API key',
        5000,
      );
      console.error(error);
    } finally {
      submitting = false;
    }
  }

  async function onDeny(): Promise<void> {
    submitting = true;
    try {
      const response = await fetch('/app/api/user/cli-auth/deny', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userCode: cliRequest?.userCode }),
      });

      if (!response.ok) {
        toast.error(cliAuthErrorMessage(response.status), 5000);
        return;
      }

      cliResult = 'denied';
    } catch (error) {
      toast.error('Failed to deny the request', 5000);
      console.error(error);
    } finally {
      submitting = false;
    }
  }

  async function onCopyValue(): Promise<void> {
    if (!createdValue) {
      return;
    }
    await navigator.clipboard.writeText(createdValue);
    toast.success('API key copied to clipboard', 5000);
  }
</script>

<Modal {isOpen} onClose={close} dismissible={!createdValue}>
  <div class="flex flex-col gap-5 sm:p-6">
    {#if createdValue}
      <div class="flex flex-col gap-4">
        <div class="flex items-center gap-3">
          <div class="bg-surface-150-bg rounded-lg p-2.5">
            <KeyIcon class="text-brand size-5 stroke-[1.2]" />
          </div>
          <h2 class="text-lg font-medium">Personal API key created</h2>
        </div>

        <p class="text-warning text-sm">
          Copy this key now. You won't be able to see it again.
        </p>

        <div class="flex items-center gap-2">
          <code
            class="ph-no-capture bg-surface-150-bg border-surface-150-border min-w-0 flex-1 rounded-lg border p-3 font-mono text-sm break-all"
          >
            {createdValue}
          </code>
          <Button variant="primary" onclick={onCopyValue}>
            <CopyIcon class="size-4" />
            Copy
          </Button>
        </div>

        <div class="flex justify-end">
          <Button variant="ghost" onclick={close}>Done</Button>
        </div>
      </div>
    {:else if cliResult === 'approved'}
      <div class="flex flex-col items-center gap-3 py-6 text-center">
        <CheckIcon class="text-success size-9 stroke-[0.67]" />
        <h2 class="text-lg font-medium">Approved</h2>
        <p class="text-fg-tertiary text-sm">
          Return to your terminal to continue.
        </p>
        <Button variant="ghost" class="mt-2" onclick={close}>Close</Button>
      </div>
    {:else if cliResult === 'denied'}
      <div class="flex flex-col items-center gap-3 py-6 text-center">
        <CloseIcon class="text-error size-9 stroke-[0.67]" />
        <h2 class="text-lg font-medium">Request denied</h2>
        <p class="text-fg-tertiary text-sm">
          The CLI authorization request was denied.
        </p>
        <Button variant="ghost" class="mt-2" onclick={close}>Close</Button>
      </div>
    {:else}
      <div class="flex items-center gap-3">
        <div class="bg-surface-150-bg rounded-lg p-2.5">
          <KeyIcon class="text-brand size-5 stroke-[1.2]" />
        </div>
        <h2 class="text-lg font-medium">
          {mode === 'cli' ? 'Authorize CLI access' : 'Create personal API key'}
        </h2>
      </div>

      {#if mode === 'cli' && cliRequest}
        <div
          class="border-surface-150-border bg-surface-150-bg flex flex-col gap-2 rounded-lg border p-3 text-sm"
        >
          <p class="text-fg-tertiary">
            A CLI on
            <span class="text-fg-default font-mono font-medium">
              {cliRequest.clientIp || 'an unknown address'}
            </span>
            is requesting access to your account.
          </p>
          <dl class="text-fg-tertiary flex flex-col gap-1 text-xs">
            <div class="flex justify-between gap-3">
              <dt>Code</dt>
              <dd class="text-fg-default font-mono font-medium">
                {cliRequest.userCode}
              </dd>
            </div>
            <div class="flex justify-between gap-3">
              <dt>Client (self-reported)</dt>
              <dd class="text-fg-default truncate font-mono">
                {cliRequest.clientUserAgent || 'not reported'}
              </dd>
            </div>
            <div class="flex justify-between gap-3">
              <dt>Requested</dt>
              <dd class="text-fg-default">
                {formatTimestamp(cliRequest.requestedAt)}
              </dd>
            </div>
          </dl>
          <p class="text-fg-tertiary text-xs">
            If you did not just run <span class="font-mono">ld login</span>
            on that machine, deny this request.
          </p>
        </div>
      {/if}

      <div class="flex flex-col gap-5">
        {#if mode === 'manage'}
          <label class="flex flex-col gap-1.5">
            <span class="text-sm font-medium">Label</span>
            <Input
              bind:value={label}
              class="w-full"
              placeholder="e.g. My laptop CLI"
            />
          </label>
        {/if}

        <div class="flex flex-col gap-2">
          <span class="text-sm font-medium">Scopes</span>
          <div class="flex flex-col gap-1.5">
            {#each scopeRows as row (row.resource)}
              <div
                class="flex flex-wrap items-center justify-between gap-x-3 gap-y-1"
              >
                <span class="text-sm">{row.label}</span>
                <SegmentedControl
                  size="xs"
                  label={row.label}
                  options={row.options}
                  value={scopeAction(row.resource)}
                  onChange={(action: Action) => setScope(row.resource, action)}
                />
              </div>
            {/each}
          </div>
          {#if canDeleteMonitors}
            <p class="text-warning text-xs">
              Can permanently delete monitors and their history.
            </p>
          {/if}
        </div>

        <div class="flex flex-col gap-2">
          <span class="text-sm font-medium">Access</span>
          <p class="text-fg-tertiary -mt-1 text-xs">
            Everything, or only the domains or services you pick.
          </p>
          <SegmentedControl
            label="Access"
            options={accessOptions}
            value={accessKind}
            onChange={(kind: AccessRestriction['kind']) => (accessKind = kind)}
          />

          {#if accessKind === 'clusters'}
            <div
              class="border-surface-elevated-border mt-1 flex max-h-40 flex-col gap-1 overflow-y-auto rounded-lg border p-2"
            >
              {#if clusters.length === 0}
                <p class="text-fg-tertiary p-1 text-sm">No domains yet.</p>
              {/if}
              {#each clusters as cluster (cluster.id)}
                <label class="flex items-center gap-2 p-1 text-sm">
                  <Checkbox
                    checked={selectedClusterIds.includes(cluster.id)}
                    onchange={() => toggleCluster(cluster.id)}
                  />
                  {cluster.name}
                </label>
              {/each}
            </div>
          {:else if accessKind === 'projects'}
            <div
              class="border-surface-elevated-border mt-1 flex max-h-40 flex-col gap-1 overflow-y-auto rounded-lg border p-2"
            >
              {#if clustersWithProjects.length === 0}
                <p class="text-fg-tertiary p-1 text-sm">No services yet.</p>
              {/if}
              {#each clustersWithProjects as cluster (cluster.id)}
                <p class="text-fg-muted px-1 pt-1 text-xs">
                  {cluster.name}
                </p>
                {#each cluster.projects ?? [] as project (project.id)}
                  <label class="flex items-center gap-2 p-1 text-sm">
                    <Checkbox
                      checked={selectedProjectIds.includes(project.id)}
                      onchange={() => toggleProject(project.id)}
                    />
                    {project.name}
                  </label>
                {/each}
              {/each}
            </div>
          {/if}
        </div>

        {#if mode === 'manage'}
          <div class="flex flex-col gap-1.5">
            <span class="text-sm font-medium">Expiry</span>
            <Select class="w-full" aria-label="Expiry" bind:value={expiryDays}>
              {#each EXPIRY_OPTIONS as option (option.label)}
                <option value={option.days}>{option.label}</option>
              {/each}
            </Select>
          </div>
        {:else}
          <div class="flex flex-col gap-1.5">
            <span class="text-sm font-medium">Expiry</span>
            <p class="text-fg-tertiary text-xs">
              CLI keys always expire after 30 days. You can revoke this one
              sooner from Account → API keys.
            </p>
          </div>
        {/if}
      </div>

      <div class="flex justify-end gap-2">
        {#if mode === 'cli'}
          <Button variant="danger-ghost" disabled={submitting} onclick={onDeny}>
            Deny
          </Button>
        {:else}
          <Button variant="ghost" onclick={close}>Cancel</Button>
        {/if}
        <Button
          variant="primary"
          disabled={!hasAccessTargets}
          loading={submitting}
          onclick={onSubmit}
        >
          {mode === 'cli' ? 'Approve' : 'Create key'}
        </Button>
      </div>
    {/if}
  </div>
</Modal>
