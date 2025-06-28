<script lang="ts">
  import { ClusterRole } from '$lib/clusters/clusters/domain/cluster-invite';
  import { clusterInvitesState } from '$lib/clusters/clusters/application/cluster-invites.state.svelte.js';
  import { clustersState } from '$lib/clusters/clusters/application/clusters.state.svelte.js';
  import Modal from '$lib/shared/ui/Modal.svelte';
  import UpgradeElement from '$lib/shared/upgrade/UpgradeElement.svelte';
  import { TrashIcon, UserPlusIcon, MailIcon } from 'lucide-svelte';

  type Props = {
    clusterId: string;
    isOpen: boolean;
    onClose: () => void;
  };

  const { clusterId, isOpen, onClose }: Props = $props();

  let emailInput = $state('');
  let selectedRole = $state<ClusterRole>(ClusterRole.WRITE);

  const cluster = $derived(clustersState.get(clusterId));

  $effect(() => {
    if (isOpen && clusterId) {
      clusterInvitesState.loadInvites(clusterId);
    }
  });

  const handleInviteUser = async (): Promise<void> => {
    if (!emailInput.trim()) return;

    try {
      await clusterInvitesState.createInvite(
        clusterId,
        emailInput.trim(),
        selectedRole,
      );
      emailInput = '';
    } catch (error) {
      // Error is already handled in the state
    }
  };

  const handleDeleteInvite = async (inviteId: string): Promise<void> => {
    try {
      await clusterInvitesState.deleteInvite(inviteId);
    } catch (error) {
      // Error is already handled in the state
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
</script>

<Modal {isOpen} {onClose}>
  <div class="p-6">
    <div class="mb-6 flex items-center gap-3">
      <UserPlusIcon class="text-primary h-6 w-6" />
      <div>
        <h2 class="text-xl font-semibold">Manage Team Access</h2>
        {#if cluster}
          <span class="text-primary text-sm font-medium">{cluster.name}</span>
        {/if}
      </div>
    </div>

    {#if clusterInvitesState.isLoading}
      <div class="flex justify-center py-8">
        <span class="loading loading-spinner loading-lg"></span>
      </div>
    {:else}
      <!-- Capacity Information -->
      {#if clusterInvitesState.capacity}
        <div class="bg-base-200 mb-6 rounded-lg p-4">
          <div class="flex items-center justify-between text-sm">
            <span>Team members:</span>
            <span class="font-mono">
              {clusterInvitesState.capacity.currentUsersCount +
                clusterInvitesState.capacity.currentInvitesCount}
              / {clusterInvitesState.capacity.maxMembers}
            </span>
          </div>
          <div class="bg-base-300 mt-2 h-2 w-full rounded-full">
            <div
              class="bg-primary h-2 rounded-full"
              style="width: {((clusterInvitesState.capacity.currentUsersCount +
                clusterInvitesState.capacity.currentInvitesCount) /
                clusterInvitesState.capacity.maxMembers) *
                100}%"
            ></div>
          </div>
        </div>
      {/if}

      <!-- Invite New User Form -->
      {#if clusterInvitesState.canInviteMore}
        <div class="mb-6">
          <h3 class="mb-4 text-lg font-medium">Invite new member</h3>
          <div class="flex gap-3">
            <div class="form-control flex-1">
              <div class="input-group">
                <span class="bg-base-200">
                  <MailIcon class="h-4 w-4" />
                </span>
                <input
                  type="email"
                  placeholder="Enter email address"
                  class="input input-bordered w-full"
                  bind:value={emailInput}
                  disabled={clusterInvitesState.isCreating}
                />
              </div>
            </div>
            <select
              class="select select-bordered"
              bind:value={selectedRole}
              disabled={clusterInvitesState.isCreating}
            >
              <option value={ClusterRole.WRITE}>Write Access</option>
              <option value={ClusterRole.CREATOR}>Admin Access</option>
            </select>
            <button
              class="btn btn-primary"
              onclick={handleInviteUser}
              disabled={!emailInput.trim() || clusterInvitesState.isCreating}
            >
              {#if clusterInvitesState.isCreating}
                <span class="loading loading-spinner loading-xs"></span>
              {:else}
                Invite
              {/if}
            </button>
          </div>
        </div>
      {:else}
        <UpgradeElement source="cluster-invite-limit" class="mb-6">
          <div class="bg-warning/10 border-warning/20 rounded-lg border p-4">
            <div class="text-warning flex items-center gap-2">
              <UserPlusIcon class="h-5 w-5" />
              <span class="font-medium">Team limit reached</span>
            </div>
            <p class="text-base-content/70 mt-2 text-sm">
              Upgrade your plan to invite more team members
            </p>
          </div>
        </UpgradeElement>
      {/if}

      {#if clusterInvitesState.invites.length > 0}
        <div>
          <h3 class="mb-4 text-lg font-medium">Pending invitations</h3>
          <div class="space-y-3">
            {#each clusterInvitesState.invites as invite}
              <div
                class="bg-base-200 flex items-center justify-between rounded-lg p-3"
              >
                <div class="flex-1">
                  <div class="font-medium">
                    {invite.invitedUserEmail}
                  </div>
                  <div class="text-base-content/70 text-sm">
                    Invited {formatDate(invite.createdAt)} • {invite.role ===
                    ClusterRole.CREATOR
                      ? 'Admin'
                      : 'Write'} access
                  </div>
                </div>
                <button
                  class="btn btn-ghost btn-sm text-error hover:bg-error/10"
                  onclick={() => handleDeleteInvite(invite.id)}
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
      {:else}
        <div class="text-base-content/50 py-8 text-center">
          <UserPlusIcon class="mx-auto mb-3 h-12 w-12 opacity-30" />
          <p>No pending invitations</p>
        </div>
      {/if}
    {/if}

    <div class="border-base-300 mt-6 flex justify-end gap-3 border-t pt-6">
      <button class="btn btn-ghost" onclick={onClose}>Close</button>
    </div>
  </div>
</Modal>
