import { createLogDash } from '@logdash/js-sdk';

const { logger } = createLogDash({
  apiKey: process.env.LOGDASH_API_KEY,
});

export const bffLogger = logger;
