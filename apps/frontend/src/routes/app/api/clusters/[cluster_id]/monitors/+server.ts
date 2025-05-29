import { minToMs } from '$lib/shared/utils/time';
import { json, type RequestHandler } from '@sveltejs/kit';
import { produce } from 'sveltekit-sse';

const UNLOCK_TIMEOUT = minToMs(1);
const PING_INTERVAL = 30_000;
const PING_COUNT = 3;

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
const createPingScheduler = (url: string, emit: Function) => {
	const timeouts: ReturnType<typeof setTimeout>[] = [];

	const ping = async (id: number) => {
		const start = Date.now();

		try {
			const response = await fetch(url, {
				method: 'HEAD',
				signal: AbortSignal.timeout(5000),
			});

			emit(
				'ping-status',
				JSON.stringify({
					id,
					status: 'success',
					statusCode: response.status,
					responseTime: Date.now() - start,
					timestamp: new Date().toISOString(),
				}),
			);
		} catch (error) {
			emit(
				'ping-status',
				JSON.stringify({
					id,
					status: 'failed',
					error:
						error instanceof Error
							? error.message
							: 'Unknown error',
					responseTime: Date.now() - start,
					timestamp: new Date().toISOString(),
				}),
			);
		}
	};

	for (let i = 0; i < PING_COUNT; i++) {
		// emit(
		// 	'ping-status',
		// 	JSON.stringify({
		// 		id: i + 1,
		// 		status: 'scheduled',
		// 		timestamp: new Date().toISOString(),
		// 	}),
		// );

		timeouts.push(setTimeout(() => ping(i + 1), i * PING_INTERVAL));
	}

	return () => timeouts.forEach(clearTimeout);
};

export const POST: RequestHandler = async ({ params, cookies, request }) => {
	return produce(
		async function start({ emit, lock }) {
			const body = await request.json().catch(() => ({}));
			const pingUrl = body.url;

			console.log('pingUrl:', pingUrl);

			const cleanupPings = pingUrl
				? createPingScheduler(pingUrl, emit)
				: () => {};
			const unlockTimer = setTimeout(
				() => lock.set(false),
				UNLOCK_TIMEOUT,
			);

			return () => {
				clearTimeout(unlockTimer);
				cleanupPings();
			};
		},
		{
			ping: 30000,
			stop() {
				console.log('[Monitor] Client disconnected.');
			},
		},
	);
};
