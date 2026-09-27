import { dev } from '$app/environment';
import { error } from '@sveltejs/kit';
import { PublicDashboardBadgeService } from '@logdash/hyper-ui/features/public-dashboard/services/index';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ params, request, url }) => {
	const customDomainHref = dev ? url.searchParams.get('custom-domain') : url.host;

	if (!customDomainHref) {
		error(404, 'Custom domain not found');
	}

	return PublicDashboardBadgeService.fetchBadge(customDomainHref, params.badge_key, request);
};
