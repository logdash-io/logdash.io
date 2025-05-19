import { goto } from '$app/navigation';

export class AuthInterceptor {
	handle(response: Response): Response {
		if (response.status === 401) {
			// localStorage.removeItem('logdash_access_token');
			// localStorage.removeItem('logdash_project_id');
			// localStorage.removeItem('logdash_api_key');

			goto('/app/auth');
		}

		return response;
	}
}

export const authInterceptor = new AuthInterceptor();
