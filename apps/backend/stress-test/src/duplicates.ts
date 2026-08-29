import { createLogDash } from '@logdash/core';
import { requireApiKey } from './env';

const { logger } = createLogDash({
  apiKey: requireApiKey(),
});

for (let i = 0; i < 50; i++) {
  logger.log(`${i}`);
}
