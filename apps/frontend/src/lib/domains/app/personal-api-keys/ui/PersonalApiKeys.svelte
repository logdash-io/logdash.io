<script lang="ts">
  import { confirmDialog } from '$lib/domains/shared/ui/confirm/confirm.state.svelte.js';
  import { invalidateAll } from '$app/navigation';
  import { topBarState } from '$lib/domains/app/clusters/application/top-bar.state.svelte.js';
  import PlusIcon from '$lib/domains/shared/icons/PlusIcon.svelte';
  import TrashIcon from '$lib/domains/shared/icons/TrashIcon.svelte';
  import EmptyState from '$lib/domains/shared/ui/components/EmptyState.svelte';
  import IconButton from '$lib/domains/shared/ui/components/IconButton.svelte';
  import { TOOLBAR_PRIMARY } from '$lib/domains/shared/ui/components/toolbar.js';
  import Well from '$lib/domains/shared/ui/components/Well.svelte';
  import { toast } from '$lib/domains/shared/ui/toaster/toast.state.svelte.js';
  import {
    ACTION_LABELS,
    RESOURCES,
    type PersonalApiKey,
  } from '../domain/personal-api-key.js';
  import PersonalApiKeyCreateModal from './PersonalApiKeyCreateModal.svelte';

  type Props = {
    apiKeys: PersonalApiKey[];
  };

  const { apiKeys }: Props = $props();

  let createModalOpen = $state(false);
  let revokingId = $state<string | null>(null);

  $effect(() => topBarState.show(toolbar));

  function onOpenCreate(): void {
    createModalOpen = true;
  }

  function onCloseCreate(): void {
    createModalOpen = false;
  }

  async function onCreated(): Promise<void> {
    await invalidateAll();
  }

  async function onRevoke(key: PersonalApiKey): Promise<void> {
    const confirmed = await confirmDialog.ask({
      title: 'Revoke API key',
      description: `Anything using ${key.label} stops working right away. This cannot be undone.`,
      confirmLabel: 'Revoke key',
    });

    if (!confirmed) {
      return;
    }

    revokingId = key.id;

    try {
      const response = await fetch(
        `/app/api/user/personal-api-keys/${key.id}`,
        { method: 'DELETE' },
      );

      if (!response.ok) {
        throw new Error('Failed to revoke');
      }

      toast.success('API key revoked', 5000);
      await invalidateAll();
    } catch (error) {
      toast.error('Failed to revoke the API key', 5000);
      console.error(error);
    } finally {
      revokingId = null;
    }
  }

  function scopeSummary(key: PersonalApiKey): string {
    const active = key.scopes.filter((scope) => scope.action !== 'none');
    if (active.length === 0) {
      return 'No scopes';
    }
    return active
      .map(
        (scope) =>
          `${RESOURCES.find((row) => row.resource === scope.resource)?.label ?? scope.resource}: ${ACTION_LABELS[scope.action].toLowerCase()}`,
      )
      .join(', ');
  }

  function accessSummary(key: PersonalApiKey): string {
    if (key.access?.kind === 'clusters') {
      return plural(key.access.ids.length, 'domain');
    }
    if (key.access?.kind === 'projects') {
      return plural(key.access.ids.length, 'service');
    }
    return 'All domains';
  }

  function lastUsedSummary(key: PersonalApiKey): string {
    if (!key.lastUsedAt) {
      return 'Never used';
    }
    return `Used ${formatDate(key.lastUsedAt)}`;
  }

  function expirySummary(key: PersonalApiKey): string {
    if (!key.expiresAt) {
      return 'No expiry';
    }
    if (isExpired(key)) {
      return 'Expired';
    }
    return `Expires ${formatDate(key.expiresAt)}`;
  }

  function isExpired(key: PersonalApiKey): boolean {
    return !!key.expiresAt && new Date(key.expiresAt).getTime() <= Date.now();
  }

  function plural(count: number, noun: string): string {
    return `${count} ${noun}${count === 1 ? '' : 's'}`;
  }

  function formatDate(value: string): string {
    return new Date(value).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
</script>

<div class="flex w-full flex-col gap-2 p-2">
  <Well label="API keys" title="API keys">
    {#snippet actions()}
      <span class="text-fg-muted px-3 text-xs tabular-nums">
        {plural(apiKeys.length, 'key')}
      </span>
    {/snippet}

    {#if apiKeys.length === 0}
      <EmptyState
        centered
        title="No API keys yet"
        description="Create one for the CLI, an MCP server or any tool that acts on your behalf."
      />
    {:else}
      <ul class="edge-between flex flex-col">
        {#each apiKeys as key (key.id)}
          <li class="flex items-center gap-4 px-3 py-3">
            <div class="flex min-w-0 flex-1 flex-col gap-1">
              <div class="flex min-w-0 items-baseline gap-2">
                <span class="truncate text-sm font-medium">{key.label}</span>
                <span class="text-fg-muted shrink-0 font-mono text-xs">
                  {key.prefix}…
                </span>
              </div>
              <span class="text-fg-tertiary text-[13px]">
                {scopeSummary(key)}
              </span>
              <span class="text-fg-muted flex flex-wrap gap-x-2 text-xs">
                <span>{accessSummary(key)}</span>
                <span aria-hidden="true">·</span>
                <span>{lastUsedSummary(key)}</span>
                <span aria-hidden="true">·</span>
                <span>Created {formatDate(key.createdAt)}</span>
                <span aria-hidden="true">·</span>
                <span class={{ 'text-error': isExpired(key) }}>
                  {expirySummary(key)}
                </span>
              </span>
            </div>

            <IconButton
              label="Revoke {key.label}"
              tooltip="Revoke key"
              danger
              well
              class="-mr-1.5"
              disabled={revokingId !== null}
              onclick={() => onRevoke(key)}
            >
              <TrashIcon class="size-4" />
            </IconButton>
          </li>
        {/each}
      </ul>
    {/if}
  </Well>
</div>

<PersonalApiKeyCreateModal
  isOpen={createModalOpen}
  mode="manage"
  onClose={onCloseCreate}
  {onCreated}
/>

{#snippet toolbar()}
  <button type="button" class={TOOLBAR_PRIMARY} onclick={onOpenCreate}>
    <PlusIcon class="size-4" />
    New key
  </button>
{/snippet}
