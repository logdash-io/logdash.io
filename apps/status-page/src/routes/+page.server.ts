import { dev } from '$app/environment';
import { envConfig } from '@logdash/hyper-ui';
import { fetchStatusPage, StatusPageError } from '@logdash/status';
import { error } from '@sveltejs/kit';
import { logger } from '$lib/server/logger';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const statusPageId = dev ? url.searchParams.get('custom-domain') : url.host;

	if (!statusPageId) {
		error(404, 'Status page not found');
	}

	try {
		const page = await fetchStatusPage(statusPageId, { baseUrl: envConfig.apiBaseUrl });

		return { statusPageId, page };
	} catch (err) {
		if (err instanceof StatusPageError && err.status === 404) {
			error(404, 'Status page not found');
		}

		if (err instanceof StatusPageError && err.status === 403) {
			error(403, 'This status page is private');
		}

		logger().error(
			`failed to load status page ${statusPageId}: ${err instanceof Error ? err.message : String(err)}`
		);
		logger().mutateMetric('statusPageLoadFailures', 1);
		error(503, 'Status page is temporarily unavailable');
	}
};
