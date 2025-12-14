import { createLogDash } from '@logdash/js-sdk';

const { logger } = createLogDash({
  apiKey: import.meta.env.LOGDASH_API_KEY,
});

export const bffLogger = logger;
