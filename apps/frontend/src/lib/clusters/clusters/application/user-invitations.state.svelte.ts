import type { ClusterInvite } from '$lib/clusters/clusters/domain/cluster-invite';
import { ClusterInvitesService } from '$lib/clusters/clusters/infrastructure/cluster-invites.service';
import { toast } from '$lib/shared/ui/toaster/toast.state.svelte.js';

type UserInvitationsStateType = {
  invitations: ClusterInvite[];
  isLoading: boolean;
  isAccepting: boolean;
  isDeclining: boolean;
};

class UserInvitationsState {
  private _state = $state<UserInvitationsStateType>({
    invitations: [],
    isLoading: false,
    isAccepting: false,
    isDeclining: false,
  });

  get invitations(): ClusterInvite[] {
    return this._state.invitations;
  }

  get isLoading(): boolean {
    return this._state.isLoading;
  }

  get isAccepting(): boolean {
    return this._state.isAccepting;
  }

  get isDeclining(): boolean {
    return this._state.isDeclining;
  }

  get hasPendingInvitations(): boolean {
    return this._state.invitations.length > 0;
  }

  startPollingInvitations(): () => void {
    const interval = setInterval(async () => {
      await this.loadInvitations();
    }, 1000);

    return () => clearInterval(interval);
  }

  async loadInvitations(): Promise<void> {
    this._state.isLoading = true;
    try {
      const invitations = await ClusterInvitesService.getUserClusterInvites();
      this._state.invitations = invitations;
    } catch (error) {
      console.error('Failed to load user invitations:', error);
      toast.error('Failed to load invitations');
    } finally {
      this._state.isLoading = false;
    }
  }

  async acceptInvitation(inviteId: string): Promise<void> {
    this._state.isAccepting = true;
    try {
      await ClusterInvitesService.acceptClusterInvite(inviteId);
      this._state.invitations = this._state.invitations.filter(
        (invite) => invite.id !== inviteId,
      );
      toast.success('Invitation accepted successfully');
    } catch (error) {
      console.error('Failed to accept invitation:', error);
      toast.error('Failed to accept invitation');
      throw error;
    } finally {
      this._state.isAccepting = false;
    }
  }

  async declineInvitation(inviteId: string): Promise<void> {
    this._state.isDeclining = true;
    try {
      await ClusterInvitesService.deleteClusterInvite(inviteId);
      this._state.invitations = this._state.invitations.filter(
        (invite) => invite.id !== inviteId,
      );
      toast.success('Invitation declined');
    } catch (error) {
      console.error('Failed to decline invitation:', error);
      toast.error('Failed to decline invitation');
      throw error;
    } finally {
      this._state.isDeclining = false;
    }
  }

  reset(): void {
    this._state.invitations = [];
    this._state.isLoading = false;
    this._state.isAccepting = false;
    this._state.isDeclining = false;
  }
}

export const userInvitationsState = new UserInvitationsState();
