<script lang="ts">
  import { goto } from '$app/navigation';
  import { clustersState } from '$lib/domains/app/clusters/application/clusters.state.svelte.js';
  import { clusterInvitesState } from '$lib/domains/app/clusters/application/cluster-invites.state.svelte.js';
  import { ClusterRole } from '$lib/domains/app/clusters/domain/cluster-invite';
  import { userState } from '$lib/domains/shared/user/application/user.state.svelte.js';
  import { toast } from '$lib/domains/shared/ui/toaster/toast.state.svelte.js';
  import { validateEmail } from '$lib/domains/shared/utils/validators.js';
  import {
    CopyIcon,
    PenLineIcon,
    Trash2Icon,
    ChevronRightIcon,
    AlertTriangleIcon,
    MailIcon,
  } from 'lucide-svelte';

  type Props = {
    clusterId: string;
  };

  const { clusterId }: Props = $props();

  const cluster = $derived(clustersState.get(clusterId));
  const isCreator = $derived(
    clustersState.isUserClusterCreator(userState.id, clusterId),
  );

  let newName = $state('');
  let isEditingName = $state(false);
  let emailInput = $state('');
  let emailError = $state('');

  const isEmailValid = $derived.by(() => {
    if (!emailInput.trim()) return false;
    return validateEmail(emailInput) === '';
  });

  $effect(() => {
    if (cluster?.name) {
      newName = cluster.name;
    }
  });

  $effect(() => {
    emailError = validateEmail(emailInput);
  });

  $effect(() => {
    let cleanup: () => void;

    if (clusterId && isCreator) {
      clusterInvitesState.loadInvitesAndCapacity(clusterId);
      cleanup = clusterInvitesState.startInvitesPolling(clusterId);
    }

    return () => {
      cleanup?.();
    };
  });

  function onStartRenaming(): void {
    isEditingName = true;
  }

  function onCancelRenaming(): void {
    isEditingName = false;
    newName = cluster?.name || '';
  }

  function onSaveRename(): void {
    if (!newName || newName.trim() === '') {
      toast.warning('Project name cannot be empty', 5000);
      return;
    }

    if (newName === cluster?.name) {
      isEditingName = false;
      return;
    }

    clustersState.update(clusterId, { name: newName }).then(() => {
      toast.success('Project name updated successfully', 5000);
      isEditingName = false;
    });
  }

  function onDeleteProject(): void {
    if (
      !confirm(
        'Are you sure you want to delete this project? This action cannot be undone and will delete all services and data.',
      )
    ) {
      return;
    }

    const onDeleted = toast.info('Deleting project...', 60000);

    clustersState
      .delete(clusterId)
      .then(() => {
        onDeleted();
        toast.success('Project deleted successfully', 5000);
        goto('/app/clusters');
      })
      .catch((error) => {
        onDeleted();
        toast.error(`Failed to delete project: ${error.message}`, 5000);
      });
  }

  async function onInviteUser(): Promise<void> {
    if (!emailInput.trim() || !isEmailValid) return;

    try {
      await clusterInvitesState.createInvite(
        clusterId,
        emailInput.trim(),
        ClusterRole.WRITE,
      );
      emailInput = '';
    } catch (error) {}
  }

  async function onDeleteInvite(inviteId: string): Promise<void> {
    try {
      await clusterInvitesState.deleteInvite(inviteId);
    } catch (error) {}
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
</script>

<div class="flex w-full justify-center p-6">
  <div class="flex w-full max-w-2xl flex-col gap-6">
    {#if isCreator}
      <div class="ld-card-base overflow-hidden rounded-3xl">
        <div class="border-b border-base-100 px-6 py-4">
          <h2 class="text-lg font-semibold">Team Management</h2>
          <p class="text-base-content/60 text-sm">
            Manage who has access to this project
          </p>
        </div>

        <div class="px-6 py-4">
          {#if clusterInvitesState.isLoading}
            <div class="flex justify-center py-8">
              <span class="loading loading-spinner loading-lg"></span>
            </div>
          {:else}
            {#if clusterInvitesState.capacity}
              <div class="mb-4">
                <div class="flex items-center justify-between text-sm">
                  <span class="text-base-content/60">Team members</span>
                  <span class="font-mono text-xs">
                    {clusterInvitesState.capacity.currentUsersCount +
                      clusterInvitesState.capacity
                        .currentInvitesCount}/{clusterInvitesState.capacity
                      .maxMembers}
                  </span>
                </div>
                <div class="bg-primary/20 mt-2 h-1.5 w-full rounded-full">
                  <div
                    class="bg-primary h-1.5 rounded-full transition-all"
                    style="width: {((clusterInvitesState.capacity
                      .currentUsersCount +
                      clusterInvitesState.capacity.currentInvitesCount) /
                      clusterInvitesState.capacity.maxMembers) *
                      100}%"
                  ></div>
                </div>
              </div>

              <div class="flex flex-col gap-2">
                {#each clusterInvitesState.capacity.members as member}
                  <div
                    class="flex items-center gap-3 rounded-xl bg-base-100/50 p-3"
                  >
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
                    <MailIcon class="h-[1em] opacity-50" />
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
            {/if}

            {#if clusterInvitesState.invites.length > 0}
              <div class="mt-4 border-t border-base-100/50 pt-4">
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
                          Invited {formatDate(invite.createdAt)} • {invite.role ===
                          ClusterRole.CREATOR
                            ? 'Admin'
                            : 'Write'} access
                        </div>
                      </div>
                      <button
                        class="btn btn-square btn-ghost btn-sm text-error hover:bg-error/10"
                        onclick={() => onDeleteInvite(invite.id)}
                        disabled={clusterInvitesState.isDeleting}
                      >
                        {#if clusterInvitesState.isDeleting}
                          <span
                            class="loading loading-spinner loading-xs"
                          ></span>
                        {:else}
                          <Trash2Icon class="h-4 w-4" />
                        {/if}
                      </button>
                    </div>
                  {/each}
                </div>
              </div>
            {/if}
          {/if}
        </div>
      </div>
    {/if}

    <div class="ld-card-base overflow-hidden rounded-3xl">
      <div class="border-b border-base-100 px-6 py-4">
        <h2 class="text-lg font-semibold">Project Information</h2>
        <p class="text-base-content/60 text-sm">
          Basic details about your project
        </p>
      </div>

      <div class="flex flex-col">
        <div
          class="flex items-center justify-between border-b border-base-100/50 px-6 py-4"
        >
          <div class="flex items-center gap-4">
            <div class="rounded-lg bg-base-100 p-2.5">
              <PenLineIcon class="h-5 w-5 text-base-content/70" />
            </div>
            <div>
              <p class="text-base-content/60 text-sm">Project Name</p>
              {#if isEditingName}
                <input
                  bind:value={newName}
                  class="input input-sm mt-1 w-64"
                  placeholder="Enter project name"
                  onkeydown={(e) => {
                    if (e.key === 'Enter') onSaveRename();
                    if (e.key === 'Escape') onCancelRenaming();
                  }}
                />
              {:else}
                <p class="font-medium">{cluster?.name || 'Unknown'}</p>
              {/if}
            </div>
          </div>
          <div class="flex items-center gap-2">
            {#if isEditingName}
              <button
                onclick={onCancelRenaming}
                class="btn btn-ghost btn-sm"
                disabled={clustersState.isUpdating}
              >
                Cancel
              </button>
              <button
                onclick={onSaveRename}
                class="btn btn-primary btn-sm"
                disabled={clustersState.isUpdating}
              >
                {#if clustersState.isUpdating}
                  <span class="loading loading-spinner loading-xs"></span>
                {:else}
                  Save
                {/if}
              </button>
            {:else}
              <button
                onclick={onStartRenaming}
                class="btn btn-ghost btn-sm text-base-content/60"
              >
                Rename
                <ChevronRightIcon class="h-4 w-4" />
              </button>
            {/if}
          </div>
        </div>

        <div class="flex items-center justify-between px-6 py-4">
          <div class="flex items-center gap-4">
            <div class="rounded-lg bg-base-100 p-2.5">
              <CopyIcon class="h-5 w-5 text-base-content/70" />
            </div>
            <div>
              <p class="text-base-content/60 text-sm">Project ID</p>
              <p class="font-mono text-sm">{clusterId}</p>
            </div>
          </div>
          <button
            onclick={() => {
              navigator.clipboard.writeText(clusterId);
              toast.success('Project ID copied to clipboard', 5000);
            }}
            class="btn btn-ghost btn-sm text-base-content/60"
          >
            <CopyIcon class="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>

    {#if isCreator}
      <div class="overflow-hidden rounded-3xl border border-error/20">
        <div class="border-b border-error/20 bg-error/5 px-6 py-4">
          <div class="flex items-center gap-2">
            <AlertTriangleIcon class="h-5 w-5 text-error" />
            <h2 class="text-lg font-semibold text-error">Danger Zone</h2>
          </div>
          <p class="text-base-content/60 mt-1 text-sm">
            Irreversible actions that affect your project
          </p>
        </div>

        <div class="ld-card-bg flex items-center justify-between px-6 py-4">
          <div class="flex items-center gap-4">
            <div class="rounded-lg bg-error/10 p-2.5">
              <Trash2Icon class="h-5 w-5 text-error" />
            </div>
            <div>
              <p class="font-medium">Delete Project</p>
              <p class="text-base-content/60 text-sm">
                Permanently delete this project and all its services
              </p>
            </div>
          </div>
          <button
            onclick={onDeleteProject}
            disabled={clustersState.isDeleting}
            class="btn btn-error btn-outline btn-sm"
          >
            {#if clustersState.isDeleting}
              <span class="loading loading-spinner loading-xs"></span>
            {:else}
              Delete
            {/if}
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>
