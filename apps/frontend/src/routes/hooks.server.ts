import { building } from '$app/environment';
import { save_client_address } from '$lib/domains/shared/utils/cookies.utils.js';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async (p) => {
  console.log('handle', building);
  if (building) {
    // apply different logic here
  } else {
    const clientIp = p.event.getClientAddress();
    save_client_address(p.event.cookies, btoa(clientIp));
  }

  return p.resolve(p.event);
};
