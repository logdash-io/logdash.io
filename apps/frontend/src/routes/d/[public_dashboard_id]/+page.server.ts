import { envConfig } from '$lib/domains/shared/utils/env-config';
import { fetchStatusPage, StatusPageError } from '@logdash/status';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  try {
    const page = await fetchStatusPage(params.public_dashboard_id, {
      baseUrl: envConfig.apiBaseUrl,
    });

    return { statusPageId: params.public_dashboard_id, page };
  } catch (err) {
    if (err instanceof StatusPageError && err.status === 404) {
      error(404, 'Status page not found');
    }

    if (err instanceof StatusPageError && err.status === 403) {
      error(403, 'This status page is private');
    }

    console.error('Failed to load status page:', err);
    error(503, 'Status page is temporarily unavailable');
  }
};
