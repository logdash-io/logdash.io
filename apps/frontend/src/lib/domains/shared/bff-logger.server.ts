import { Logdash } from '@logdash/node';

const logdash = new Logdash(process.env.LOGDASH_API_KEY);

export const bffLogger = logdash;
