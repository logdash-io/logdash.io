<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import PersonalApiKeyCreateModal from '$lib/domains/app/personal-api-keys/ui/PersonalApiKeyCreateModal.svelte';
  import type { PersonalApiKey } from '$lib/domains/app/personal-api-keys/domain/personal-api-key.js';
  import {
    SettingsCard,
    SettingsCardHeader,
    SettingsCardItem,
  } from '$lib/domains/shared/ui/components/settings-card/index.js';
  import { toast } from '$lib/domains/shared/ui/toaster/toast.state.svelte.js';
  import KeyIcon from '$lib/domains/shared/icons/KeyIcon.svelte';
  import PlusIcon from '$lib/domains/shared/icons/PlusIcon.svelte';
  import TrashIcon from '$lib/domains/shared/icons/TrashIcon.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let createModalOpen = $state(false);
  let revokingId = $state<string | null>(null);

  function scopeSummary(key: PersonalApiKey): string {
    const active = key.scopes.filter((scope) => scope.action !== 'none');
    if (active.length === 0) {
      return 'No scopes';
    }
    return active
      .map((scope) => `${scope.resource}:${scope.action}`)
      .join(', ');
  }

  function accessSummary(key: PersonalApiKey): string {
    if (key.access?.kind === 'clusters') {
      return `${key.access.ids.length} cluster(s)`;
    }
    if (key.access?.kind === 'projects') {
      return `${key.access.ids.length} project(s)`;
    }
    return 'All access';
  }

  function formatDate(value?: string): string {
    if (!value) {
      return '—';
    }
    return new Date(value).toLocaleDateString();
  }

  async function onRevoke(key: PersonalApiKey): Promise<void> {
    const confirmed = confirm(
      `Revoke the API key "${key.label}"? Any integration using it will stop working immediately.`,
    );

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

  async function onCreated(): Promise<void> {
    await invalidateAll();
  }
</script>

<div class="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6">
  <SettingsCard>
    <SettingsCardHeader
      title="Personal API keys"
      description="Keys for the CLI, MCP servers and other integrations acting on your behalf"
      icon={KeyIcon}
    />

    <div class="flex items-center justify-between p-4">
      <p class="text-base-content/60 text-sm">
        {data.apiKeys.length} key{data.apiKeys.length === 1 ? '' : 's'}
      </p>
      <button
        type="button"
        class="btn btn-primary btn-sm"
        onclick={() => (createModalOpen = true)}
      >
        <PlusIcon class="size-4" />
        Create personal API key
      </button>
    </div>

    {#if data.apiKeys.length === 0}
      <div class="text-base-content/60 p-4 pt-0 text-sm">
        You don't have any personal API keys yet.
      </div>
    {:else}
      {#each data.apiKeys as key, index (key.id)}
        <SettingsCardItem
          icon={KeyIcon}
          showBorder={index < data.apiKeys.length - 1}
        >
          {#snippet children()}
            <p class="font-medium">{key.label}</p>
            <p class="font-mono text-sm">{key.prefix}…</p>
            <p class="text-base-content/60 mt-1 text-xs">
              {scopeSummary(key)}
            </p>
            <p class="text-base-content/60 text-xs">
              {accessSummary(key)} · Last used {formatDate(key.lastUsedAt)} ·
              Created {formatDate(key.createdAt)}
            </p>
          {/snippet}
          {#snippet action()}
            <button
              type="button"
              class="btn btn-error btn-outline btn-sm"
              disabled={revokingId === key.id}
              onclick={() => onRevoke(key)}
            >
              {#if revokingId === key.id}
                <span class="loading loading-spinner loading-xs"></span>
              {:else}
                <TrashIcon class="size-4" />
                Revoke
              {/if}
            </button>
          {/snippet}
        </SettingsCardItem>
      {/each}
    {/if}
  </SettingsCard>
</div>

<PersonalApiKeyCreateModal
  isOpen={createModalOpen}
  mode="manage"
  onClose={() => (createModalOpen = false)}
  {onCreated}
/>
