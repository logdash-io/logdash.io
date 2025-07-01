import { goto } from '$app/navigation';

export class AuthInterceptor {
	handle(response: Response): Response {
		if (response.status === 401) {
			goto('/app/auth');
		}

		return response;
	}
}

export const authInterceptor = new AuthInterceptor();
