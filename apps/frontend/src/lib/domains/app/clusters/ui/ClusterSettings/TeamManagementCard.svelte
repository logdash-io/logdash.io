<script lang="ts">
  import { clusterInvitesState } from '$lib/domains/app/clusters/application/cluster-invites.state.svelte.js';
  import { ClusterRole } from '$lib/domains/app/clusters/domain/cluster-invite';
  import { validateEmail } from '$lib/domains/shared/utils/validators.js';
  import {
    SettingsCard,
    SettingsCardHeader,
  } from '$lib/domains/shared/ui/components/settings-card';
  import UpgradeElement from '$lib/domains/shared/upgrade/UpgradeElement.svelte';
  import AtIcon from '$lib/domains/shared/icons/AtIcon.svelte';
  import { DangerIcon } from '@logdash/hyper-ui/icons';
  import TrashIcon from '$lib/domains/shared/icons/TrashIcon.svelte';

  type Props = {
    clusterId: string;
  };

  const { clusterId }: Props = $props();

  let emailInput = $state('');

  const emailError = $derived(validateEmail(emailInput));
  const isEmailValid = $derived(emailInput.trim() && emailError === '');
  const capacity = $derived(clusterInvitesState.capacity);
  const memberCount = $derived(
    capacity ? capacity.currentUsersCount + capacity.currentInvitesCount : 0,
  );
  const usagePercent = $derived(
    capacity ? (memberCount / capacity.maxMembers) * 100 : 0,
  );

  $effect(() => {
    clusterInvitesState.loadInvitesAndCapacity(clusterId);
    const cleanup = clusterInvitesState.startInvitesPolling(clusterId);
    return () => cleanup();
  });

  async function onInviteUser(): Promise<void> {
    if (!emailInput.trim() || !isEmailValid) return;

    try {
      await clusterInvitesState.createInvite(
        clusterId,
        emailInput.trim(),
        ClusterRole.WRITE,
      );
      emailInput = '';
    } catch {}
  }

  async function onDeleteInvite(inviteId: string): Promise<void> {
    try {
      await clusterInvitesState.deleteInvite(inviteId);
    } catch {}
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  function formatRole(role: ClusterRole): string {
    return role === ClusterRole.CREATOR ? 'Admin' : 'Write';
  }
</script>

<SettingsCard>
  <SettingsCardHeader
    title="Team Management"
    description="Manage who has access to this project"
  />

  <div class="p-4">
    {#if clusterInvitesState.isLoading || !capacity}
      <div class="flex justify-center py-8">
        <span
          class="loading loading-spinner loading-xs text-base-content/60"
        ></span>
      </div>
    {:else}
      {#if capacity}
        <div class="mb-4">
          <div class="flex items-center justify-between text-sm">
            <span class="text-base-content/60">Team members</span>
            <span class="font-mono text-xs">
              {memberCount}/{capacity.maxMembers}
            </span>
          </div>
          <div class="bg-primary/20 mt-2 h-1 w-full rounded-full">
            <div
              class="bg-primary h-1 rounded-full transition-all"
              style="width: {usagePercent}%"
            ></div>
          </div>
        </div>

        <div class="flex flex-col gap-2">
          {#each capacity.members as member}
            <div class="flex items-center gap-3 rounded-xl bg-base-100/50 p-3">
              <div class="avatar">
                <div class="w-8 rounded-full">
                  <img
                    src={member.avatarUrl}
                    alt={member.email}
                    class="rounded-full"
                  />
                </div>
              </div>
              <span class="flex-1 truncate text-sm">{member.email}</span>
              <span
                class={[
                  'badge badge-soft badge-sm',
                  {
                    'badge-primary': member.role === ClusterRole.CREATOR,
                    'badge-secondary': member.role === ClusterRole.WRITE,
                  },
                ]}
              >
                {member.role}
              </span>
            </div>
          {/each}
        </div>
      {/if}

      {#if clusterInvitesState.canInviteMore}
        <div class="mt-4 border-t border-base-100/50 pt-4">
          <div class="flex gap-3">
            <label
              class={[
                'input outline-primary focus-within:border-primary flex-1 ring-0 focus-within:ring-0 focus-within:outline-0',
                { 'input-error': emailError && emailInput.trim() },
              ]}
            >
              <AtIcon class="size-4 opacity-50" />
              <input
                type="email"
                class="grow"
                placeholder="New member email address"
                bind:value={emailInput}
                disabled={clusterInvitesState.isCreating}
                onkeydown={(e) => {
                  if (e.key === 'Enter') onInviteUser();
                }}
              />
            </label>
            <button
              class="btn btn-primary"
              onclick={onInviteUser}
              disabled={!isEmailValid || clusterInvitesState.isCreating}
            >
              {#if clusterInvitesState.isCreating}
                <span class="loading loading-spinner loading-xs"></span>
              {:else}
                Invite
              {/if}
            </button>
          </div>
          {#if emailError && emailInput.trim()}
            <div class="text-error mt-1 text-sm">{emailError}</div>
          {/if}
        </div>
      {:else if capacity}
        <UpgradeElement source="cluster-invite-limit" class="mt-4">
          <div class="primary-card rounded-xl p-4">
            <div class="text-primary flex items-center gap-2">
              <DangerIcon class="size-5" />
              <span class="font-medium">Team limit reached</span>
            </div>
            <p class="text-base-content/70 mt-2 text-sm">
              Upgrade your plan to invite more team members
            </p>
          </div>
        </UpgradeElement>
      {/if}

      {#if clusterInvitesState.invites.length > 0}
        <div class="pt-4">
          <h3 class="text-base-content/60 mb-2 text-sm font-medium">
            Pending invitations
          </h3>
          <div class="flex flex-col gap-2">
            {#each clusterInvitesState.invites as invite}
              <div
                class="flex items-center justify-between rounded-xl bg-base-100/50 p-3"
              >
                <div class="flex-1">
                  <div class="text-sm font-medium">
                    {invite.invitedUserEmail}
                  </div>
                  <div class="text-base-content/60 text-xs">
                    Invited {formatDate(invite.createdAt)} • {formatRole(
                      invite.role,
                    )} access
                  </div>
                </div>
                <button
                  class="btn btn-square btn-ghost btn-sm text-error hover:bg-error/10"
                  onclick={() => onDeleteInvite(invite.id)}
                  disabled={clusterInvitesState.isDeleting}
                >
                  {#if clusterInvitesState.isDeleting}
                    <span class="loading loading-spinner loading-xs"></span>
                  {:else}
                    <TrashIcon class="h-4 w-4" />
                  {/if}
                </button>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    {/if}
  </div>
</SettingsCard>
