import { logdashAPI } from '$lib/shared/logdash.api.js';
import { get_access_token } from '$lib/shared/utils/cookies.utils.js';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ params, url, cookies }) => {
	const projectId = url.searchParams.get('project_id');

	if (!projectId) {
		return json(
			{
				success: false,
				error: 'Project id is required',
			},
			{ status: 400 },
		);
	}

	const pings = await logdashAPI.get_monitor_pings({
		project_id: projectId,
		monitor_id: params.monitor_id,
		access_token: get_access_token(cookies),
		limit: 10,
	});

	return json({
		success: true,
		data: pings,
	});
};
