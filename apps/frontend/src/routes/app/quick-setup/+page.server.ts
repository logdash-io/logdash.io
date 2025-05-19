import { logdashAPI } from '$lib/shared/logdash.api';
import { Feature } from '$lib/shared/types';
import { save_access_token } from '$lib/shared/utils/cookies.utils';
import { redirect, type ServerLoadEvent } from '@sveltejs/kit';

export const load = async ({
	cookies,
	url,
}: ServerLoadEvent): Promise<void> => {
	const { cluster_id, access_token } =
		await logdashAPI.create_anonymous_user();
	const feature = url.searchParams.get('feature');

	const valid_features = [
		Feature.LOGGING,
		Feature.METRICS,
		Feature.MONITORING,
	];
	if (feature && !valid_features.includes(feature as Feature)) {
		redirect(302, '/');
	}

	if ([Feature.LOGGING, Feature.METRICS].includes(feature as Feature)) {
		await logdashAPI.create_project('default', cluster_id, access_token);
	}

	save_access_token(cookies, access_token);

	redirect(302, `/app/clusters/${cluster_id}/setup/${feature}`);
};
