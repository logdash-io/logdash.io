import { goto } from '$app/navigation';

export class AuthInterceptor {
  handle(response: Response): Response {
    if (response.status === 401) {
      // eslint-disable-next-line svelte/no-navigation-without-resolve
      goto('/app/auth');
    }

    return response;
  }
}

export const authInterceptor = new AuthInterceptor();
