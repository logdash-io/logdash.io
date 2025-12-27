import { userState } from '$lib/domains/shared/user/application/user.state.svelte.js';

const STORAGE_KEY_PREFIX = 'logdash:sdk-selection-index';

function getStorageKey(userId: string | undefined): string | null {
  if (!userId) {
    return null;
  }
  return `${STORAGE_KEY_PREFIX}:${userId}`;
}

function getStoredIndex(userId: string | undefined): number {
  if (typeof window === 'undefined') {
    return 0;
  }

  const storageKey = getStorageKey(userId);
  if (!storageKey) {
    return 0;
  }

  const stored = localStorage.getItem(storageKey);
  if (stored === null) {
    return 0;
  }

  const parsed = parseInt(stored, 10);
  return isNaN(parsed) ? 0 : parsed;
}

class SDKSelectionState {
  selectedIndex = $state(0);
  private lastUserId: string | undefined = undefined;

  public initialize(): void {
    const userId = userState.id;
    if (userId && userId !== this.lastUserId) {
      this.lastUserId = userId;
      this.selectedIndex = getStoredIndex(userId);
    }
  }

  public setSelectedIndex(index: number): void {
    this.selectedIndex = index;

    if (typeof window !== 'undefined') {
      const storageKey = getStorageKey(userState.id);
      if (storageKey) {
        localStorage.setItem(storageKey, String(index));
      }
    }
  }
}

export const sdkSelectionState = new SDKSelectionState();
