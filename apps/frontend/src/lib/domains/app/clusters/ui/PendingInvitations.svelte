<script lang="ts">
  import { CheckIcon, CloseIcon } from '@logdash/hyper-ui/icons';
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
  <div class="success-card mb-4 w-full rounded-xl px-2">
    <div class="space-y-0">
      {#each invitations as invitation, index (invitation.id)}
        <div
          class={[
            'flex items-center justify-between rounded-lg p-3 pr-1',
            {
              'border-success/20 rounded-b-none border-b':
                invitations.length > 1 && index !== invitations.length - 1,
            },
          ]}
        >
          <div class="flex flex-1 items-center">
            <div class="text-sm font-medium">
              {invitation.clusterName} • Invited {formatDate(
                invitation.createdAt,
              )} • {invitation.role === ClusterRole.CREATOR ? 'Admin' : 'Write'}
              access
            </div>
          </div>

          <div class="flex gap-2">
            <Button
              variant="success-soft"
              size="xs"
              onclick={() => onInvitationAccepted(invitation.id)}
              disabled={userInvitationsState.isDeclining}
              loading={userInvitationsState.isAccepting}
            >
              <CheckIcon class="h-4 w-4" />
              Accept
            </Button>

            <Button
              variant="danger-soft"
              size="xs"
              onclick={() => onInvitationDeclined(invitation.id)}
              disabled={userInvitationsState.isAccepting}
              loading={userInvitationsState.isDeclining}
            >
              <CloseIcon class="h-4 w-4" />
              Decline
            </Button>
          </div>
        </div>
      {/each}
    </div>
  </div>
{/if}
