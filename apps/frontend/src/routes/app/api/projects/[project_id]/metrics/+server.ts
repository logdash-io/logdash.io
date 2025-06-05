import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { logdashAPI } from '$lib/shared/logdash.api';
import { produce } from 'sveltekit-sse';
import { get_access_token } from '$lib/shared/utils/cookies.utils';
import { minToMs } from '$lib/shared/utils/time';
import { createConnectionManager } from '$lib/shared/utils/sse-connection-manager';

export const GET: RequestHandler = async ({ cookies, params, url }) => {
	const logs = await logdashAPI.get_project_metrics(
		params.project_id,
		get_access_token(cookies),
	);

	console.log('got metrics', logs);

	return json({
		status: 200,
		data: logs,
	});
};

const UNLOCK_TIMEOUT = minToMs(5);

const metricsConnectionManager = createConnectionManager('project-metrics');

export const POST: RequestHandler = async ({ params, cookies, request }) => {
	const clientId = metricsConnectionManager.getClientId(
		request,
		cookies,
		params.project_id,
	);

	return produce(
		async function start({ emit, lock }) {
			const cleanupConnection =
				metricsConnectionManager.registerConnection(clientId, lock);

			const es = logdashAPI.poll_project_metrics(
				params.project_id,
				get_access_token(cookies),
			);

			es.addEventListener('message', (event) => {
				emit('message', event.data);
			});

			const t = setTimeout(function unlock() {
				lock.set(false);
			}, UNLOCK_TIMEOUT);

			return () => {
				console.log('[Metrics Polling] Connection cancelled.');
				cleanupConnection();
				clearTimeout(t);
				es.close();
			};
		},
		{
			ping: 1000,
			stop() {
				console.log('[Metrics Polling] Client disconnected.');
			},
		},
	);
};
