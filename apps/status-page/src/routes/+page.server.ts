import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { dev } from '$app/environment';
import { envConfig } from '@logdash/hyper-ui';

// Server-compatible version of PublicDashboardService
class ServerPublicDashboardService {
	static async getPublicData(dashboardIdOrUrl: string, period: '24h' | '7d' | '90d' = '90d') {
		const response = await fetch(
			`${envConfig.apiBaseUrl}/public_dashboards/${dashboardIdOrUrl}/public_data?period=${period}`
		);

		if (!response.ok) {
			throw new Error(`Failed to fetch dashboard data: ${response.status}`);
		}

		return response.json();
	}
}

export const load: PageServerLoad = async ({ url }) => {
	const customDomainHref = dev ? url.searchParams.get('custom-domain') : url.host;
	if (!customDomainHref) {
		error(404, 'Custom domain not found');
	}

	try {
		const dashboardData = await ServerPublicDashboardService.getPublicData(customDomainHref);

		return {
			dashboardId: customDomainHref,
			dashboardData
		};
	} catch (err) {
		console.error('Failed to load public dashboard:', err);
		error(404, 'Dashboard not found');
	}
};
