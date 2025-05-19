import { createLogDash } from '@logdash/js-sdk';
import { envConfig } from './utils/env-config';

const { logger } = createLogDash({
	apiKey: envConfig.bffLogdashApiKey,
});

export const bffLogger = logger;
