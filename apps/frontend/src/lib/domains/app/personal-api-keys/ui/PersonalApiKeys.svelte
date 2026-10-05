<script lang="ts">
  import { confirmDialog } from '$lib/domains/shared/ui/confirm/confirm.state.svelte.js';
  import { invalidateAll } from '$app/navigation';
  import PaneHeader, {
    PANE_HEADER_ACTION_CLASS,
  } from '$lib/domains/shared/ui/components/PaneHeader.svelte';
  import PlusIcon from '$lib/domains/shared/icons/PlusIcon.svelte';
  import EmptyState from '$lib/domains/shared/ui/components/EmptyState.svelte';
  import { toast } from '$lib/domains/shared/ui/toaster/toast.state.svelte.js';
  import { Button } from '@logdash/hyper-ui/presentational';
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

<div class="flex w-full flex-col">
  <PaneHeader title="API keys">
    <span class="tabular-nums">{plural(apiKeys.length, 'key')}</span>
    {#if apiKeys.length > 0}
      <button
        type="button"
        class={PANE_HEADER_ACTION_CLASS}
        onclick={onOpenCreate}
      >
        <PlusIcon class="size-3.5 shrink-0" />
        New key
      </button>
    {/if}
  </PaneHeader>

  {#if apiKeys.length === 0}
    <EmptyState
      class="p-4"
      title="No API keys yet"
      description="Create one for the CLI, an MCP server or any tool that acts on your behalf."
    >
      <Button variant="primary" size="sm" onclick={onOpenCreate}>
        <PlusIcon class="size-4" />
        Create API key
      </Button>
    </EmptyState>
  {:else}
    <ul class="flex flex-col edge-between edge-b">
      {#each apiKeys as key (key.id)}
        <li class="flex items-center gap-4 px-4 py-4">
          <div class="flex min-w-0 flex-1 flex-col gap-1">
            <div class="flex min-w-0 items-baseline gap-2">
              <span class="truncate text-sm">{key.label}</span>
              <span class="text-fg-muted shrink-0 font-mono text-xs">
                {key.prefix}…
              </span>
            </div>
            <span class="text-fg-tertiary text-sm">{scopeSummary(key)}</span>
            <span
              class="text-fg-muted flex flex-wrap gap-x-2 font-mono text-xs"
            >
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

          <Button
            variant="danger-ghost"
            size="sm"
            class="-mr-3"
            loading={revokingId === key.id}
            onclick={() => onRevoke(key)}
          >
            Revoke
          </Button>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<PersonalApiKeyCreateModal
  isOpen={createModalOpen}
  mode="manage"
  onClose={onCloseCreate}
  {onCreated}
/>
