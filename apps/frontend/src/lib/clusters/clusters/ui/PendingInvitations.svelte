<script lang="ts">
  import { CheckIcon, XIcon } from 'lucide-svelte';
  import { clustersState } from '../application/clusters.state.svelte.js';
  import { userInvitationsState } from '../application/user-invitations.state.svelte.js';
  import { ClusterRole } from '../domain/cluster-invite.js';

  async function onInvitationAccepted(inviteId: string): Promise<void> {
    try {
      await userInvitationsState.acceptInvitation(inviteId);
      clustersState.load();
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
</script>

{#if userInvitationsState.hasPendingInvitations}
  <div class="success-card mb-4 w-full rounded-xl pl-2">
    <div class="space-y-3">
      {#each userInvitationsState.invitations as invitation}
        <div class="flex items-center justify-between rounded-lg p-3">
          <div class="flex flex-1 items-center">
            <div class="text-sm font-medium">
              {invitation.clusterName} • Invited {formatDate(
                invitation.createdAt,
              )} • {invitation.role === ClusterRole.CREATOR ? 'Admin' : 'Write'}
              access
            </div>
          </div>

          <div class="flex gap-2">
            <button
              class="btn btn-soft btn-success btn-xs"
              onclick={() => onInvitationAccepted(invitation.id)}
              disabled={userInvitationsState.isAccepting ||
                userInvitationsState.isDeclining}
            >
              {#if userInvitationsState.isAccepting}
                <span class="loading loading-spinner loading-xs"></span>
              {:else}
                <CheckIcon class="h-4 w-4" />
                Accept
              {/if}
            </button>

            <button
              class="btn btn-error btn-xs btn-soft"
              onclick={() => onInvitationDeclined(invitation.id)}
              disabled={userInvitationsState.isAccepting ||
                userInvitationsState.isDeclining}
            >
              {#if userInvitationsState.isDeclining}
                <span class="loading loading-spinner loading-xs"></span>
              {:else}
                <XIcon class="h-4 w-4" />
                Decline
              {/if}
            </button>
          </div>
        </div>
      {/each}
    </div>
  </div>
{/if}
