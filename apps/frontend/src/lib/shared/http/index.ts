import { redirect } from '@sveltejs/kit';
import { httpClient } from './http-client';

httpClient.registerUnauthorizedHandler(() => {
  console.log('Unauthorized: Your session has expired');
  redirect(302, '/app/auth');
});

export { httpClient };
