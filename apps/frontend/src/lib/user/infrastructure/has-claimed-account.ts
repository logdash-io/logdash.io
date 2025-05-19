import { logdashAPI } from '$lib/shared/logdash.api';

export const has_claimed_account = async (
	access_token: string,
): Promise<boolean> => {
	const user = await logdashAPI.get_me(access_token);

	return user.accountClaimStatus === 'claimed';
};
