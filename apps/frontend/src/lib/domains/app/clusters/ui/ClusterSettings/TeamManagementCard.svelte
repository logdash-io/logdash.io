<script lang="ts">
  import UsersIcon from '$lib/domains/shared/icons/UsersIcon.svelte';
  import { clusterInvitesState } from '$lib/domains/app/clusters/application/cluster-invites.state.svelte.js';
  import { ClusterRole } from '$lib/domains/app/clusters/domain/cluster-invite';
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
  import { Button, Input } from '@logdash/hyper-ui/presentational';
  import { match } from 'ts-pattern';

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
        ClusterRole.WRITE,
      );
      emailInput = '';
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

  function roleLabel(role: ClusterRole): string {
    return match(role)
      .with(ClusterRole.CREATOR, () => 'Owner')
      .with(ClusterRole.ADMIN, () => 'Admin')
      .with(ClusterRole.WRITE, () => 'Member')
      .exhaustive();
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

    {#each capacity.members as member (member.email)}
      <SettingsCardItem>
        <div class="flex min-w-0 items-center gap-3">
          <span class="text-fg-muted w-16 shrink-0">
            {roleLabel(member.role)}
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
        <div class="flex min-w-0 items-center gap-3">
          <span class="text-fg-muted w-16 shrink-0">Invite</span>
          <Input
            type="email"
            size="sm"
            class={['-my-1.5 min-w-0 flex-1', SETTINGS_INPUT_CLASS]}
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
          <Button
            variant="primary"
            size="sm"
            class="-my-1.5"
            onclick={onInviteUser}
            disabled={!isEmailValid}
            loading={clusterInvitesState.isCreating}
          >
            Send
          </Button>
        </div>
        {#if emailError && emailInput.trim()}
          <p class="text-error mt-2.5 pl-19">{emailError}</p>
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
