import { createLogDash } from '@logdash/js-sdk';
import { envConfig } from '$lib/domains/shared/utils/env-config';

const { logger } = createLogDash({
  apiKey: envConfig.bffLogdashApiKey,
});

export const bffLogger = logger;
