import { building } from '$app/environment';
import { logger } from '$lib/server/logger';
import type { Handle, HandleServerError, ServerInit } from '@sveltejs/kit';

const SECURITY_HEADERS = {
	'Content-Security-Policy': "frame-ancestors 'none'",
	'X-Content-Type-Options': 'nosniff',
	'Referrer-Policy': 'strict-origin-when-cross-origin'
};

export const init: ServerInit = () => {
	if (building) {
		return;
	}

	logger().info('Status page server started');
	process.on('sveltekit:shutdown', () => void flushLogs());
};

async function flushLogs(): Promise<void> {
	await logger().flush();
	logger().destroy();
}

export const handleError: HandleServerError = ({ error, event, status }) => {
	if (status < 500) {
		return;
	}

	logger().error(
		`unhandled error on ${event.route.id ?? 'an unknown route'}: ${error instanceof Error ? error.message : String(error)}`
	);
	logger().mutateMetric('unhandledErrors', 1);
};

export const handle: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);

	for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
		if (!response.headers.has(name)) {
			response.headers.set(name, value);
		}
	}

	return response;
};
