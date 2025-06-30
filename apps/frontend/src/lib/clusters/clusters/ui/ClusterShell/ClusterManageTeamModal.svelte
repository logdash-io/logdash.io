<script lang="ts">
  import { ClusterRole } from '$lib/clusters/clusters/domain/cluster-invite';
  import { clusterInvitesState } from '$lib/clusters/clusters/application/cluster-invites.state.svelte.js';
  import { clustersState } from '$lib/clusters/clusters/application/clusters.state.svelte.js';
  import Modal from '$lib/shared/ui/Modal.svelte';
  import UpgradeElement from '$lib/shared/upgrade/UpgradeElement.svelte';
  import { TrashIcon, UserPlusIcon, MailIcon, Users } from 'lucide-svelte';
  import { validateEmail } from '$lib/shared/utils/validators.js';

  type Props = {
    clusterId: string;
    isOpen: boolean;
    onClose: () => void;
  };

  const { clusterId, isOpen, onClose }: Props = $props();

  let emailInput = $state('');
  let selectedRole = $state<ClusterRole>(ClusterRole.WRITE);
  let emailError = $state('');

  const cluster = $derived(clustersState.get(clusterId));

  const isEmailValid = $derived.by(() => {
    if (!emailInput.trim()) return false;
    return validateEmail(emailInput) === '';
  });

  $effect(() => {
    let cleanup: () => void;

    if (isOpen && clusterId) {
      clusterInvitesState.loadInvitesAndCapacity(clusterId);
      cleanup = clusterInvitesState.startInvitesPolling(clusterId);
    }

    return () => {
      cleanup?.();
    };
  });

  $effect(() => {
    emailError = validateEmail(emailInput);
  });

  const handleInviteUser = async (): Promise<void> => {
    if (!emailInput.trim() || !isEmailValid) return;

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
  <div class="mb-6 flex items-center gap-4">
    <div
      class="primary-card flex h-14 w-14 items-center justify-center rounded-full"
    >
      <Users class="text-primary h-6 w-6" />
    </div>

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
    {#if clusterInvitesState.capacity}
      <div class="mb-6 p-1">
        <div class="flex items-center justify-between text-sm">
          <span>Team members</span>
          <span class="font-mono text-xs">
            {clusterInvitesState.capacity.currentUsersCount +
              clusterInvitesState.capacity
                .currentInvitesCount}/{clusterInvitesState.capacity.maxMembers}
          </span>
        </div>

        <div class="bg-primary/20 mt-2 h-1.5 w-full rounded-full">
          <div
            class="bg-primary h-1.5 rounded-full"
            style="width: {((clusterInvitesState.capacity.currentUsersCount +
              clusterInvitesState.capacity.currentInvitesCount) /
              clusterInvitesState.capacity.maxMembers) *
              100}%"
          ></div>
        </div>

        <div class="mt-4 flex flex-col gap-2">
          {#each clusterInvitesState.capacity.members as member}
            <div class="ld-card-base flex items-center gap-2 rounded-xl p-3">
              <div class="avatar">
                <div class="w-8 rounded-full">
                  <img
                    src={member.avatarUrl}
                    alt={member.email}
                    class="rounded-full"
                  />
                </div>
              </div>
              <span class="text-sm">{member.email}</span>
              <span
                class={[
                  'badge badge-soft badge-sm ml-auto',
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
      </div>
    {/if}

    {#if clusterInvitesState.canInviteMore}
      <div class="mb-6">
        <div class="flex gap-3">
          <div class="flex-1">
            <label
              class={[
                'input outline-primary focus-within:border-primary w-full ring-0 focus-within:ring-0 focus-within:outline-0',
                { 'input-error': emailError && emailInput.trim() },
              ]}
            >
              <MailIcon class="h-[1em] opacity-50" />
              <input
                type="email"
                class="grow"
                placeholder="New member email address"
                bind:value={emailInput}
                disabled={clusterInvitesState.isCreating}
              />
            </label>
            <div class="mt-1 h-5">
              {#if emailError && emailInput.trim()}
                <div class="text-error text-sm">{emailError}</div>
              {/if}
            </div>
          </div>
          <button
            class="btn btn-primary"
            onclick={handleInviteUser}
            disabled={!isEmailValid || clusterInvitesState.isCreating}
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
        <div class="primary-card rounded-xl p-4">
          <div class="text-primary flex items-center gap-2">
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
        <h3 class="text-secondary mb-2 text-sm font-medium">
          Pending invitations
        </h3>
        <div class="space-y-3">
          {#each clusterInvitesState.invites as invite}
            <div
              class="ld-card-base flex items-center justify-between rounded-xl p-3 px-4"
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
                class="btn btn-square btn-sm text-error hover:bg-error/10 btn-ghost"
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
      <div class="text-base-content/50 py-4 text-center">
        <UserPlusIcon class="mx-auto mb-3 h-10 w-10 opacity-30" />
        <p>No pending invitations</p>
      </div>
    {/if}
  {/if}

  <div class="flex justify-end gap-3 pt-2">
    <button class="btn btn-ghost" onclick={onClose}>Close</button>
  </div>
</Modal>
