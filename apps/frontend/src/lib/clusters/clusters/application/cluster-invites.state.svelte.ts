import type {
  ClusterInvite,
  ClusterInviteCapacity,
  ClusterRole,
} from '$lib/clusters/clusters/domain/cluster-invite';
import { ClusterInvitesService } from '$lib/clusters/clusters/infrastructure/cluster-invites.service';
import { toast } from '$lib/shared/ui/toaster/toast.state.svelte.js';

type ClusterInvitesStateType = {
  invites: ClusterInvite[];
  capacity: ClusterInviteCapacity | null;
  isLoading: boolean;
  isCreating: boolean;
  isDeleting: boolean;
  isModalOpen: boolean;
  currentClusterId: string | null;
};

class ClusterInvitesState {
  private _state = $state<ClusterInvitesStateType>({
    invites: [],
    capacity: null,
    isLoading: false,
    isCreating: false,
    isDeleting: false,
    isModalOpen: false,
    currentClusterId: null,
  });

  get invites(): ClusterInvite[] {
    return this._state.invites;
  }

  get capacity(): ClusterInviteCapacity | null {
    return this._state.capacity;
  }

  get isLoading(): boolean {
    return this._state.isLoading;
  }

  get isCreating(): boolean {
    return this._state.isCreating;
  }

  get isDeleting(): boolean {
    return this._state.isDeleting;
  }

  get isModalOpen(): boolean {
    return this._state.isModalOpen;
  }

  get currentClusterId(): string | null {
    return this._state.currentClusterId;
  }

  get canInviteMore(): boolean {
    if (!this._state.capacity) return false;
    const { maxMembers, currentUsersCount, currentInvitesCount } =
      this._state.capacity;
    return currentUsersCount + currentInvitesCount < maxMembers;
  }

  startInvitesPolling(clusterId: string): () => void {
    const interval = setInterval(() => {
      this.loadInvitesAndCapacity(clusterId, true);
    }, 5000);

    return () => clearInterval(interval);
  }

  async loadInvitesAndCapacity(
    clusterId: string,
    silent = false,
  ): Promise<void> {
    if (!silent) {
      this._state.isLoading = true;
    }

    try {
      const [invites, capacity] = await Promise.all([
        ClusterInvitesService.getClusterInvites(clusterId),
        ClusterInvitesService.getClusterInviteCapacity(clusterId),
      ]);
      this._state.invites = invites;
      this._state.capacity = capacity;
    } catch (error) {
      toast.error('Failed to load invitations');
      console.error('Failed to load cluster invites:', error);
    } finally {
      if (!silent) {
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
      if (error instanceof Error) {
        toast.error(`Failed to send invitation: ${error.message}`);
      } else {
        toast.error('Failed to send invitation');
      }
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

  openModal(clusterId: string): void {
    this._state.isModalOpen = true;
    this._state.currentClusterId = clusterId;
  }

  closeModal(): void {
    this._state.isModalOpen = false;
    this._state.currentClusterId = null;
    this.reset();
  }

  reset(): void {
    this._state.invites = [];
    this._state.capacity = null;
    this._state.isLoading = false;
    this._state.isCreating = false;
    this._state.isDeleting = false;
  }
}

export const clusterInvitesState = new ClusterInvitesState();
