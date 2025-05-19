import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { logdashAPI } from '$lib/shared/logdash.api';
import { produce } from 'sveltekit-sse';
import { get_access_token } from '$lib/shared/utils/cookies.utils';
import { minToMs } from '$lib/shared/utils/time';
import { createConnectionManager } from '$lib/shared/utils/sse-connection-manager';

export const GET: RequestHandler = async ({ cookies, params, url }) => {
	const logs = await logdashAPI.get_project_logs(
		params.project_id,
		get_access_token(cookies),
		undefined,
		url.searchParams.get('before') || undefined,
	);

	return json({
		status: 200,
		data: logs,
	});
};

const UNLOCK_TIMEOUT = minToMs(5);

const logsConnectionManager = createConnectionManager('project-logs');

export const POST: RequestHandler = async ({
	params,
	cookies,
	request,
	url,
}) => {
	const tabId = url.searchParams.get('tab_id');
	const clientId = logsConnectionManager.getClientId(request, cookies, tabId);

	return produce(
		async function start({ emit, lock, source }) {
			const cleanupConnection = logsConnectionManager.registerConnection(
				clientId,
				lock,
			);

			const es = logdashAPI.poll_project_logs(
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
				console.log('[Logs Polling] Connection cancelled.');
				cleanupConnection();
				clearTimeout(t);
				es.close();
			};
		},
		{
			ping: 1000,
			stop() {
				console.log('[Logs Polling] Client disconnected.');
			},
		},
	);
};
