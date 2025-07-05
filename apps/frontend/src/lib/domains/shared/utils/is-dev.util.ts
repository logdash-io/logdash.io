import { envConfig } from '$lib/domains/shared/utils/env-config.js';

export const isDev = () => envConfig.stage !== 'live';
