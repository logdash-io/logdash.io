import { envConfig } from './env-config.js';

export const isDev = () => envConfig.stage !== 'live';
