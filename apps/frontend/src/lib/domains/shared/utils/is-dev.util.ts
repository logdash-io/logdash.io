import { envConfig } from '$lib/domains/shared/utils/env-config.js';

export const isLive = () => envConfig.stage === 'live';
export const isPreview = () => envConfig.stage === 'preview';
export const isLocal = () => envConfig.stage === 'local';
export const isDev = () => !isLive();
