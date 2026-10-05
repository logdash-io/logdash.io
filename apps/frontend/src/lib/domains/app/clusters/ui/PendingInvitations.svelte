<script lang="ts">
  import { CheckIcon } from '@logdash/hyper-ui/icons';
  import { Button } from '@logdash/hyper-ui/presentational';
  import { clustersState } from '$lib/domains/app/clusters/application/clusters.state.svelte.js';
  import { userInvitationsState } from '$lib/domains/app/clusters/application/user-invitations.state.svelte.js';
  import { ClusterRole } from '$lib/domains/app/clusters/domain/cluster-invite.js';

  async function onInvitationAccepted(inviteId: string): Promise<void> {
    try {
      await userInvitationsState.acceptInvitation(inviteId);
      await clustersState.load();
    } catch (error) {
      console.error('Error accepting invitation:', error);
    }
  }

  async function onInvitationDeclined(inviteId: string): Promise<void> {
    try {
      await userInvitationsState.declineInvitation(inviteId);
    } catch (error) {
      console.error('Error declining invitation:', error);
    }
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }

  const invitations = $derived(userInvitationsState.invitations);
</script>

{#if userInvitationsState.hasPendingInvitations}
  <ul
    class="flex shrink-0 flex-col edge-between edge-b"
    aria-label="Pending invitations"
  >
    {#each invitations as invitation (invitation.id)}
      <li class="flex flex-wrap items-center gap-x-4 gap-y-3 p-4">
        <div class="flex min-w-0 flex-1 flex-col gap-0.5">
          <span class="text-fg-muted text-xs">
            Invited {formatDate(invitation.createdAt)} ·
            {invitation.role === ClusterRole.CREATOR ? 'Admin' : 'Write'} access
          </span>
          <p class="min-w-0 truncate text-sm">
            Join <span class="font-medium">{invitation.clusterName}</span>
          </p>
        </div>

        <div class="flex shrink-0 gap-2">
          <Button
            variant="primary"
            size="sm"
            onclick={() => onInvitationAccepted(invitation.id)}
            disabled={userInvitationsState.isDeclining}
            loading={userInvitationsState.isAccepting}
          >
            <CheckIcon class="size-4" />
            Accept
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onclick={() => onInvitationDeclined(invitation.id)}
            disabled={userInvitationsState.isAccepting}
            loading={userInvitationsState.isDeclining}
          >
            Decline
          </Button>
        </div>
      </li>
    {/each}
  </ul>
{/if}
