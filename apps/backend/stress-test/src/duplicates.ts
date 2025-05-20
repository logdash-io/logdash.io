import { createLogDash } from '@logdash/core';

const { logger } = createLogDash({
  apiKey: 'mNDlsgqmlvU4dkacZsWAu4I9fSZNfTNf',
});

for (let i = 0; i < 50; i++) {
  logger.log(`${i}`);
}
