import { RoutePath } from '$lib/domains/shared/route-path';

/**
 * Logging out clears the session cookies, so it has to be a POST - a plain link
 * would be triggerable cross-site.
 */
export const logout = async (): Promise<void> => {
  await fetch(RoutePath.LOGOUT, {
    method: 'POST',
  });

  window.location.href = '/';
};
