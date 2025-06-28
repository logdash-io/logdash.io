import { goto } from '$app/navigation';

export const startTierUpgrade = () => {
  goto('/app/api/user/upgrade');
};
