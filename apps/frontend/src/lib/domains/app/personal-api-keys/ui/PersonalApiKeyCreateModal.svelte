<script lang="ts">
  import { clustersState } from '$lib/domains/app/clusters/application/clusters.state.svelte.js';
  import Modal from '$lib/domains/shared/ui/Modal.svelte';
  import { toast } from '$lib/domains/shared/ui/toaster/toast.state.svelte.js';
  import CopyIcon from '$lib/domains/shared/icons/CopyIcon.svelte';
  import KeyIcon from '$lib/domains/shared/icons/KeyIcon.svelte';
  import SegmentedControl from './SegmentedControl.svelte';
  import {
    cliAuthErrorMessage,
    type CliAuthRequest,
  } from '../domain/cli-auth.js';
  import {
    ACTIONS,
    PRESETS,
    RESOURCES,
    presetToScopes,
    type AccessRestriction,
    type Action,
    type CreatedPersonalApiKey,
    type PresetId,
    type Resource,
    type ScopeEntry,
  } from '../domain/personal-api-key.js';

  type Props = {
    isOpen: boolean;
    onClose: () => void;
    mode?: 'manage' | 'cli';
    /** The pending `ld login` request, resolved from the code the user typed. */
    cliRequest?: CliAuthRequest | null;
    initialPreset?: PresetId;
    onCreated?: () => void;
  };

  let {
    isOpen,
    onClose,
    mode = 'manage',
    cliRequest = null,
    initialPreset = 'cli',
    onCreated,
  }: Props = $props();

  let label = $state('');
  let preset = $state<PresetId>('cli');
  let scopes = $state<ScopeEntry[]>(presetToScopes('cli'));
  // `null` in CLI mode: granting reach must be an explicit choice, never a default.
  let accessKind = $state<AccessRestriction['kind'] | null>('all');
  let selectedClusterIds = $state<string[]>([]);
  let selectedProjectIds = $state<string[]>([]);
  let expiresAt = $state('');

  let submitting = $state(false);
  let createdValue = $state<string | null>(null);
  let cliResult = $state<'approved' | 'denied' | null>(null);

  const actionOptions = ACTIONS.map((a) => ({
    value: a.action,
    label: a.label,
  }));

  const accessOptions: { value: AccessRestriction['kind']; label: string }[] = [
    { value: 'all', label: 'All access' },
    { value: 'clusters', label: 'Clusters' },
    { value: 'projects', label: 'Projects' },
  ];

  // Seed scopes from the requested preset each time the modal opens so a
  // reopened modal always starts from a clean, preset-aligned state.
  let wasOpen = false;
  $effect(() => {
    if (isOpen && !wasOpen) {
      preset = initialPreset;
      scopes = presetToScopes(initialPreset);
      label = '';
      accessKind = mode === 'cli' ? null : 'all';
      selectedClusterIds = [];
      selectedProjectIds = [];
      expiresAt = '';
      createdValue = null;
      cliResult = null;
    }
    wasOpen = isOpen;
  });

  const clusters = $derived(clustersState.clusters);
  const projects = $derived(
    clustersState.clusters.flatMap((cluster) =>
      (cluster.projects ?? []).map((project) => ({
        id: project.id,
        name: project.name,
        clusterName: cluster.name,
      })),
    ),
  );

  function applyPreset(next: PresetId): void {
    preset = next;
    if (next !== 'custom') {
      scopes = presetToScopes(next);
    }
  }

  function setScope(resource: Resource, action: Action): void {
    scopes = scopes.map((entry) =>
      entry.resource === resource ? { ...entry, action } : entry,
    );
    // Editing the grid switches the user into custom mode.
    preset = 'custom';
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

  function activeScopes(): ScopeEntry[] {
    return scopes.filter((entry) => entry.action !== 'none');
  }

  function close(): void {
    // Reset transient creation state so reopening starts fresh.
    createdValue = null;
    cliResult = null;
    onClose();
  }

  async function onSubmit(): Promise<void> {
    if (mode === 'manage' && label.trim() === '') {
      toast.warning('Please enter a label for this key', 5000);
      return;
    }

    if (mode === 'cli' && accessKind === null) {
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
            scopes: activeScopes(),
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
            scopes: activeScopes(),
            access: buildAccess(),
            ...(expiresAt
              ? { expiresAt: new Date(expiresAt).toISOString() }
              : {}),
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create key');
        }

        const data: CreatedPersonalApiKey = await response.json();
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

  function onCopyValue(): void {
    if (!createdValue) {
      return;
    }
    navigator.clipboard.writeText(createdValue);
    toast.success('API key copied to clipboard', 5000);
  }
</script>

<Modal {isOpen} onClose={close}>
  <div class="flex flex-col gap-5 p-6">
    {#if createdValue}
      <div class="flex flex-col gap-4">
        <div class="flex items-center gap-3">
          <div class="bg-base-100 rounded-lg p-2.5">
            <KeyIcon class="text-primary size-5" />
          </div>
          <h2 class="text-lg font-semibold">Personal API key created</h2>
        </div>

        <div
          class="border-warning/40 bg-warning/10 text-warning rounded-lg border p-3 text-sm"
        >
          Copy this key now. For security reasons you won't be able to see it
          again.
        </div>

        <div class="flex items-center gap-2">
          <code
            class="bg-base-100 border-base-100 flex-1 overflow-x-auto rounded-lg border p-3 font-mono text-sm"
          >
            {createdValue}
          </code>
          <button type="button" class="btn btn-primary" onclick={onCopyValue}>
            <CopyIcon class="size-4" />
            Copy
          </button>
        </div>

        <div class="flex justify-end">
          <button type="button" class="btn btn-ghost" onclick={close}>
            Done
          </button>
        </div>
      </div>
    {:else if cliResult === 'approved'}
      <div class="flex flex-col items-center gap-3 py-6 text-center">
        <div class="text-success text-4xl">✓</div>
        <h2 class="text-lg font-semibold">Approved</h2>
        <p class="text-neutral-400 text-sm">
          Return to your terminal to continue.
        </p>
        <button type="button" class="btn btn-ghost mt-2" onclick={close}>
          Close
        </button>
      </div>
    {:else if cliResult === 'denied'}
      <div class="flex flex-col items-center gap-3 py-6 text-center">
        <div class="text-error text-4xl">✕</div>
        <h2 class="text-lg font-semibold">Request denied</h2>
        <p class="text-neutral-400 text-sm">
          The CLI authorization request was denied.
        </p>
        <button type="button" class="btn btn-ghost mt-2" onclick={close}>
          Close
        </button>
      </div>
    {:else}
      <div class="flex items-center gap-3">
        <div class="bg-base-100 rounded-lg p-2.5">
          <KeyIcon class="text-primary size-5" />
        </div>
        <h2 class="text-lg font-semibold">
          {mode === 'cli' ? 'Authorize CLI access' : 'Create personal API key'}
        </h2>
      </div>

      {#if mode === 'cli' && cliRequest}
        <div
          class="border-primary/40 bg-primary/10 flex flex-col gap-2 rounded-lg border p-3 text-sm"
        >
          <p class="text-neutral-400">
            A CLI on
            <span class="text-base-content font-mono font-semibold">
              {cliRequest.clientIp || 'an unknown address'}
            </span>
            is requesting access to your account.
          </p>
          <dl class="text-neutral-400 flex flex-col gap-1 text-xs">
            <div class="flex justify-between gap-3">
              <dt>Code</dt>
              <dd class="text-base-content font-mono font-semibold">
                {cliRequest.userCode}
              </dd>
            </div>
            <div class="flex justify-between gap-3">
              <dt>Client (self-reported)</dt>
              <dd class="text-base-content truncate font-mono">
                {cliRequest.clientUserAgent || 'not reported'}
              </dd>
            </div>
            <div class="flex justify-between gap-3">
              <dt>Requested</dt>
              <dd class="text-base-content">
                {formatTimestamp(cliRequest.requestedAt)}
              </dd>
            </div>
          </dl>
          <p class="text-neutral-400 text-xs">
            If you did not just run <span class="font-mono">ld login</span>
            on that machine, deny this request.
          </p>
        </div>
      {/if}

      <div class="max-h-[60vh] overflow-y-auto pr-1">
        <div class="flex flex-col gap-5">
          {#if mode === 'manage'}
            <div class="flex flex-col gap-1.5">
              <span class="text-sm font-medium">Label</span>
              <input
                bind:value={label}
                class="input w-full"
                placeholder="e.g. My laptop CLI"
              />
            </div>
          {/if}

          <div class="flex flex-col gap-1.5">
            <span class="text-sm font-medium">Preset</span>
            <select
              class="select w-full"
              value={preset}
              onchange={(event) =>
                applyPreset(event.currentTarget.value as PresetId)}
            >
              {#each PRESETS as presetOption (presetOption.id)}
                <option value={presetOption.id}>
                  {presetOption.label} — {presetOption.description}
                </option>
              {/each}
            </select>
          </div>

          <div class="flex flex-col gap-2">
            <span class="text-sm font-medium">Scopes</span>
            <div class="flex flex-col gap-1.5">
              {#each RESOURCES as resourceOption (resourceOption.resource)}
                <div class="flex items-center justify-between gap-3">
                  <span class="text-sm">{resourceOption.label}</span>
                  <SegmentedControl
                    size="xs"
                    options={actionOptions}
                    value={scopeAction(resourceOption.resource)}
                    onChange={(action) =>
                      setScope(resourceOption.resource, action)}
                  />
                </div>
              {/each}
            </div>
          </div>

          <div class="flex flex-col gap-2">
            <span class="text-sm font-medium">Access</span>
            {#if mode === 'cli'}
              <p class="text-neutral-400 -mt-1 text-xs">
                Pick what this key may reach. Nothing is selected by default.
              </p>
            {/if}
            <SegmentedControl
              options={accessOptions}
              value={accessKind}
              onChange={(kind) => (accessKind = kind)}
            />

            {#if accessKind === 'clusters'}
              <div
                class="border-base-100 mt-1 flex max-h-40 flex-col gap-1 overflow-y-auto rounded-lg border p-2"
              >
                {#if clusters.length === 0}
                  <p class="text-neutral-400 p-1 text-sm">
                    No clusters available.
                  </p>
                {/if}
                {#each clusters as cluster (cluster.id)}
                  <label class="flex items-center gap-2 p-1 text-sm">
                    <input
                      type="checkbox"
                      class="checkbox checkbox-sm"
                      checked={selectedClusterIds.includes(cluster.id)}
                      onchange={() => toggleCluster(cluster.id)}
                    />
                    {cluster.name}
                  </label>
                {/each}
              </div>
            {:else if accessKind === 'projects'}
              <div
                class="border-base-100 mt-1 flex max-h-40 flex-col gap-1 overflow-y-auto rounded-lg border p-2"
              >
                {#if projects.length === 0}
                  <p class="text-neutral-400 p-1 text-sm">
                    No projects available.
                  </p>
                {/if}
                {#each projects as project (project.id)}
                  <label class="flex items-center gap-2 p-1 text-sm">
                    <input
                      type="checkbox"
                      class="checkbox checkbox-sm"
                      checked={selectedProjectIds.includes(project.id)}
                      onchange={() => toggleProject(project.id)}
                    />
                    {project.name}
                    <span class="text-neutral-500">
                      ({project.clusterName})
                    </span>
                  </label>
                {/each}
              </div>
            {/if}
          </div>

          {#if mode === 'manage'}
            <div class="flex flex-col gap-1.5">
              <span class="text-sm font-medium">Expiry (optional)</span>
              <input bind:value={expiresAt} type="date" class="input w-full" />
            </div>
          {:else}
            <div class="flex flex-col gap-1.5">
              <span class="text-sm font-medium">Expiry</span>
              <p class="text-neutral-400 text-xs">
                CLI keys always expire after 30 days. You can revoke this one
                sooner from Account → API keys.
              </p>
            </div>
          {/if}
        </div>
      </div>

      <div class="flex justify-end gap-2">
        {#if mode === 'cli'}
          <button
            type="button"
            class="btn btn-error btn-outline"
            disabled={submitting}
            onclick={onDeny}
          >
            Deny
          </button>
        {:else}
          <button type="button" class="btn btn-ghost" onclick={close}>
            Cancel
          </button>
        {/if}
        <button
          type="button"
          class="btn btn-primary"
          disabled={submitting || (mode === 'cli' && accessKind === null)}
          onclick={onSubmit}
        >
          {#if submitting}
            <span class="loading loading-spinner loading-xs"></span>
          {:else if mode === 'cli'}
            Approve
          {:else}
            Create key
          {/if}
        </button>
      </div>
    {/if}
  </div>
</Modal>
