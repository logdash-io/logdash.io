import { logdashAPI } from '$lib/shared/logdash.api.js';
import { get_access_token } from '$lib/shared/utils/cookies.utils.js';
import { stripProtocol } from '$lib/shared/utils/url.js';
import { json, redirect, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({
	params,
	url,
	cookies,
	request,
}) => {
	const monitorUrl = url.searchParams.get('url');
	const projectId = url.searchParams.get('project_id');

	if (!projectId || !monitorUrl) {
		return json({
			success: false,
			message: 'Missing query params: url and/or project_id',
		});
	}

	console.log(
		`Creating monitor for project ${projectId} with URL: ${monitorUrl}`,
	);

	await logdashAPI.create_monitor(
		projectId,
		{ name: stripProtocol(monitorUrl), url: monitorUrl },
		get_access_token(cookies),
	);

	redirect(303, `/app/clusters/${params.cluster_id}?project_id=${projectId}`);
};
