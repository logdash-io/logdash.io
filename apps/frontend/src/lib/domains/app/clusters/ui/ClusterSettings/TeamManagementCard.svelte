<script lang="ts">
  import UsersIcon from '$lib/domains/shared/icons/UsersIcon.svelte';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { clusterInvitesState } from '$lib/domains/app/clusters/application/cluster-invites.state.svelte.js';
  import {
    CLUSTER_ROLE_LABELS,
    ClusterRole,
    type ClusterMember,
  } from '$lib/domains/app/clusters/domain/cluster-invite';
  import { confirmDialog } from '$lib/domains/shared/ui/confirm/confirm.state.svelte.js';
  import { userState } from '$lib/domains/shared/user/application/user.state.svelte.js';
  import { validateEmail } from '$lib/domains/shared/utils/validators.js';
  import UserIcon from '$lib/domains/shared/icons/UserIcon.svelte';
  import {
    SETTINGS_INPUT_CLASS,
    SettingsCard,
    SettingsCardItem,
  } from '$lib/domains/shared/ui/components/settings-card';
  import UpgradeElement from '$lib/domains/shared/upgrade/UpgradeElement.svelte';
  import AtIcon from '$lib/domains/shared/icons/AtIcon.svelte';
  import TrashIcon from '$lib/domains/shared/icons/TrashIcon.svelte';
  import IconButton from '$lib/domains/shared/ui/components/IconButton.svelte';
  import LoadingLine from '$lib/domains/shared/ui/components/LoadingLine.svelte';
  import { DangerIcon } from '@logdash/hyper-ui/icons';
  import { Button, Input, Select } from '@logdash/hyper-ui/presentational';

  type Props = {
    clusterId: string;
  };

  const { clusterId }: Props = $props();

  let emailInput = $state('');
  let inviteRole = $state<ClusterRole>(ClusterRole.WRITE);

  const emailError = $derived(validateEmail(emailInput));
  const isEmailValid = $derived(emailInput.trim() && emailError === '');
  const capacity = $derived(clusterInvitesState.capacity);
  const memberCount = $derived(
    capacity ? capacity.currentUsersCount + capacity.currentInvitesCount : 0,
  );

  $effect(() => {
    void clusterInvitesState.loadInvitesAndCapacity(clusterId);
    const cleanup = clusterInvitesState.startInvitesPolling(clusterId);
    return () => cleanup();
  });

  async function onInviteUser(): Promise<void> {
    if (!emailInput.trim() || !isEmailValid) return;

    try {
      await clusterInvitesState.createInvite(
        clusterId,
        emailInput.trim(),
        inviteRole,
      );
      emailInput = '';
      inviteRole = ClusterRole.WRITE;
    } catch {
      return;
    }
  }

  async function onDeleteInvite(inviteId: string): Promise<void> {
    try {
      await clusterInvitesState.deleteInvite(inviteId);
    } catch {
      return;
    }
  }

  async function onRemoveMember(member: ClusterMember): Promise<void> {
    const isSelf = member.id === userState.id;

    const confirmed = await confirmDialog.ask(
      isSelf
        ? {
            title: 'Leave domain',
            description:
              'You will lose access to this domain until someone invites you again.',
            confirmLabel: 'Leave domain',
          }
        : {
            title: 'Remove member',
            description: `${member.email || 'This member'} will lose access to this domain until someone invites them again.`,
            confirmLabel: 'Remove member',
          },
    );
    if (!confirmed) return;

    try {
      await clusterInvitesState.removeMember(clusterId, member.id);
    } catch {
      return;
    }

    if (!isSelf) return;

    void goto(resolve('/app/domains'), { invalidateAll: true });
  }

  function onInviteKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter') void onInviteUser();
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
</script>

<SettingsCard
  title="Team"
  description="People who can open this domain."
  icon={UsersIcon}
>
  {#if clusterInvitesState.isLoading || !capacity}
    <div class="min-h-36 px-3 py-2.5 text-[13px]">
      {#if clusterInvitesState.loadFailed && !clusterInvitesState.isLoading}
        <div class="text-fg-muted flex items-center gap-2">
          <DangerIcon class="size-4 shrink-0" />
          Could not load members. Retrying in a few seconds.
        </div>
      {:else}
        <LoadingLine label="Loading members" />
      {/if}
    </div>
  {:else}
    <SettingsCardItem>
      <div class="flex min-w-0 items-center gap-3">
        <span class="text-fg-muted w-16 shrink-0">Seats</span>
        <span class="tabular-nums">
          {memberCount} of {capacity.maxMembers} used
        </span>
      </div>
    </SettingsCardItem>

    {#each capacity.members as member (member.id)}
      <SettingsCardItem>
        <div class="flex min-w-0 items-center gap-3">
          <span class="text-fg-muted w-16 shrink-0">
            {CLUSTER_ROLE_LABELS[member.role]}
          </span>
          <span
            class="bg-surface-150-bg flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-full"
          >
            {#if member.avatarUrl}
              <img
                src={member.avatarUrl}
                alt=""
                class="size-full object-cover"
              />
            {:else}
              <UserIcon class="text-fg-tertiary size-3" />
            {/if}
          </span>
          <span class="min-w-0 flex-1 truncate">
            {member.email || 'Anonymous'}
          </span>
        </div>

        {#snippet action()}
          {@const isSelf = member.id === userState.id}
          {#if member.role !== ClusterRole.CREATOR}
            <IconButton
              label={isSelf
                ? 'Leave domain'
                : `Remove ${member.email || 'Anonymous'}`}
              tooltip={isSelf ? 'Leave domain' : 'Remove member'}
              danger
              well
              class="-mr-1.5"
              disabled={clusterInvitesState.isDeleting}
              onclick={() => onRemoveMember(member)}
            >
              <TrashIcon class="size-4" />
            </IconButton>
          {/if}
        {/snippet}
      </SettingsCardItem>
    {/each}

    {#each clusterInvitesState.invites as invite (invite.id)}
      <SettingsCardItem>
        <div class="flex min-w-0 items-center gap-3">
          <span class="text-fg-muted w-16 shrink-0">Invited</span>
          <span
            class="border-surface-150-border size-5 shrink-0 rounded-full border border-dashed"
          ></span>
          <span class="min-w-0 flex-1 truncate">{invite.invitedUserEmail}</span>
          <span class="text-fg-muted shrink-0 text-xs">
            {CLUSTER_ROLE_LABELS[invite.role]}
          </span>
          <span class="text-fg-muted shrink-0 font-mono text-xs max-sm:hidden">
            {formatDate(invite.createdAt)}
          </span>
        </div>

        {#snippet action()}
          <IconButton
            label="Cancel the invite to {invite.invitedUserEmail}"
            tooltip="Cancel invite"
            danger
            well
            class="-mr-1.5"
            disabled={clusterInvitesState.isDeleting}
            onclick={() => onDeleteInvite(invite.id)}
          >
            <TrashIcon class="size-4" />
          </IconButton>
        {/snippet}
      </SettingsCardItem>
    {/each}

    {#if clusterInvitesState.canInviteMore}
      <SettingsCardItem>
        <div
          class="flex min-w-0 items-center gap-3 max-sm:flex-wrap max-sm:gap-y-4"
        >
          <span class="text-fg-muted w-16 shrink-0 max-sm:hidden">Invite</span>
          <Input
            type="email"
            size="sm"
            class={[
              '-my-1.5 min-w-0 flex-1 max-sm:-my-0.5 max-sm:basis-full',
              SETTINGS_INPUT_CLASS,
            ]}
            placeholder="name@company.com"
            aria-label="Email of the person to invite"
            error={!!emailError && !!emailInput.trim()}
            bind:value={emailInput}
            disabled={clusterInvitesState.isCreating}
            onkeydown={onInviteKeydown}
          >
            {#snippet leading()}
              <AtIcon class="text-fg-muted size-3.5 shrink-0" />
            {/snippet}
          </Input>
          <Select
            size="sm"
            class={[
              '-my-1.5 w-28 shrink-0 max-sm:-my-0.5 max-sm:flex-1',
              SETTINGS_INPUT_CLASS,
            ]}
            aria-label="Role of the person to invite"
            bind:value={inviteRole}
            disabled={clusterInvitesState.isCreating}
          >
            <option value={ClusterRole.WRITE}>
              {CLUSTER_ROLE_LABELS[ClusterRole.WRITE]}
            </option>
            <option value={ClusterRole.ADMIN}>
              {CLUSTER_ROLE_LABELS[ClusterRole.ADMIN]}
            </option>
          </Select>
          <Button
            variant="primary"
            size="sm"
            class="-my-1.5 max-sm:-my-0.5"
            onclick={onInviteUser}
            disabled={!isEmailValid}
            loading={clusterInvitesState.isCreating}
          >
            Send
          </Button>
        </div>
        {#if emailError && emailInput.trim()}
          <p class="text-error mt-2.5 pl-19 max-sm:pl-0">{emailError}</p>
        {/if}
      </SettingsCardItem>
    {:else}
      <UpgradeElement
        source="cluster-invite-limit"
        class="hover:bg-surface-25-hover-bg flex min-h-12 items-center gap-3 rounded-lg px-3 py-2.5 text-[13px]"
      >
        <span class="text-fg-muted w-16 shrink-0">Invite</span>
        <span class="min-w-0 flex-1">
          All seats are taken. Upgrade to invite more people.
        </span>
        <span class="shrink-0 text-xs font-medium">Upgrade</span>
      </UpgradeElement>
    {/if}
  {/if}
</SettingsCard>
