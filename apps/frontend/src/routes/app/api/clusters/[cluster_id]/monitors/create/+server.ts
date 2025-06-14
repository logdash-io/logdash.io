import { bffLogger } from '$lib/shared/bff-logger.js';
import { logdashAPI } from '$lib/shared/logdash.api.js';
import { get_access_token } from '$lib/shared/utils/cookies.utils.js';
import { stripProtocol } from '$lib/shared/utils/url.js';
import { json, redirect, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ params, url, cookies }) => {
	const monitorUrl = url.searchParams.get('url');
	const monitorName =
		url.searchParams.get('name') || stripProtocol(monitorUrl);
	const projectId = url.searchParams.get('project_id');

	if (!projectId || !monitorUrl) {
		return json({
			success: false,
			message: 'Missing query params: url and/or project_id',
		});
	}

	bffLogger.info(
		`Creating monitor for project ${projectId} with URL: ${monitorUrl} and name: ${monitorName}`,
	);

	await logdashAPI.create_monitor(
		projectId,
		{ name: monitorName, url: monitorUrl },
		get_access_token(cookies),
	);

	redirect(303, `/app/clusters/${params.cluster_id}?project_id=${projectId}`);
};
