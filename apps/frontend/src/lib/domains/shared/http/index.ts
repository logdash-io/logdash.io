import { redirect } from '@sveltejs/kit';
import { httpClient } from '$lib/domains/shared/http/http-client';

httpClient.registerUnauthorizedHandler(() => {
  console.log('Unauthorized: Your session has expired');
  redirect(302, '/app/auth');
});

export { httpClient };
