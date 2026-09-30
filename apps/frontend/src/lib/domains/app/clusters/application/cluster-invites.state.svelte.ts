import type {
  ClusterInvite,
  ClusterInviteCapacity,
  ClusterRole,
} from '$lib/domains/app/clusters/domain/cluster-invite';
import { ClusterInvitesService } from '$lib/domains/app/clusters/infrastructure/cluster-invites.service';
import { readHttpErrorMessage } from '$lib/domains/shared/http/http-error';
import { toast } from '$lib/domains/shared/ui/toaster/toast.state.svelte.js';

type ClusterInvitesStateType = {
  invites: ClusterInvite[];
  capacity: ClusterInviteCapacity | null;
  isLoading: boolean;
  loadFailed: boolean;
  isCreating: boolean;
  isDeleting: boolean;
};

class ClusterInvitesState {
  private _state = $state<ClusterInvitesStateType>({
    invites: [],
    capacity: null,
    isLoading: false,
    loadFailed: false,
    isCreating: false,
    isDeleting: false,
  });

  private clusterId: string | null = null;

  get invites(): ClusterInvite[] {
    return this._state.invites;
  }

  get capacity(): ClusterInviteCapacity | null {
    return this._state.capacity;
  }

  get isLoading(): boolean {
    return this._state.isLoading;
  }

  get loadFailed(): boolean {
    return this._state.loadFailed;
  }

  get isCreating(): boolean {
    return this._state.isCreating;
  }

  get isDeleting(): boolean {
    return this._state.isDeleting;
  }

  get canInviteMore(): boolean {
    if (!this._state.capacity) return false;
    const { maxMembers, currentUsersCount, currentInvitesCount } =
      this._state.capacity;
    return currentUsersCount + currentInvitesCount < maxMembers;
  }

  startInvitesPolling(clusterId: string): () => void {
    const interval = setInterval(() => {
      void this.loadInvitesAndCapacity(clusterId, true);
    }, 5000);

    return () => clearInterval(interval);
  }

  async loadInvitesAndCapacity(
    clusterId: string,
    silent = false,
  ): Promise<void> {
    if (this.clusterId !== clusterId) {
      this.reset();
      this.clusterId = clusterId;
    }

    if (!silent) {
      this._state.isLoading = true;
    }

    try {
      const [invites, capacity] = await Promise.all([
        ClusterInvitesService.getClusterInvites(clusterId),
        ClusterInvitesService.getClusterInviteCapacity(clusterId),
      ]);

      if (this.clusterId !== clusterId) return;

      this._state.invites = invites;
      this._state.capacity = capacity;
      this._state.loadFailed = false;
    } catch (error) {
      if (this.clusterId !== clusterId) return;

      this._state.loadFailed = true;
      toast.error('Failed to load invitations');
      console.error('Failed to load cluster invites:', error);
    } finally {
      if (!silent && this.clusterId === clusterId) {
        this._state.isLoading = false;
      }
    }
  }

  async createInvite(
    clusterId: string,
    email: string,
    role: ClusterRole,
  ): Promise<void> {
    this._state.isCreating = true;
    try {
      const newInvite = await ClusterInvitesService.createClusterInvite(
        clusterId,
        { email, role },
      );

      this._state.invites.push(newInvite);

      if (this._state.capacity) {
        this._state.capacity = {
          ...this._state.capacity,
          currentInvitesCount: this._state.capacity.currentInvitesCount + 1,
        };
      }

      toast.success('Invitation sent successfully');
    } catch (error) {
      const message = readHttpErrorMessage(error);
      toast.error(
        message
          ? `Failed to send invitation: ${message}`
          : 'Failed to send invitation',
      );
      throw error;
    } finally {
      this._state.isCreating = false;
    }
  }

  async deleteInvite(inviteId: string): Promise<void> {
    this._state.isDeleting = true;
    try {
      await ClusterInvitesService.deleteClusterInvite(inviteId);
      this._state.invites = this._state.invites.filter(
        (invite) => invite.id !== inviteId,
      );

      if (this._state.capacity) {
        this._state.capacity = {
          ...this._state.capacity,
          currentInvitesCount: this._state.capacity.currentInvitesCount - 1,
        };
      }

      toast.success('Invitation removed successfully');
    } catch (error) {
      toast.error('Failed to remove invitation');
      console.error('Failed to delete cluster invite:', error);
      throw error;
    } finally {
      this._state.isDeleting = false;
    }
  }

  reset(): void {
    this._state.invites = [];
    this._state.capacity = null;
    this._state.isLoading = false;
    this._state.loadFailed = false;
    this._state.isCreating = false;
    this._state.isDeleting = false;
  }
}

export const clusterInvitesState = new ClusterInvitesState();
