import { env } from '$env/dynamic/private';
import { Logdash } from '@logdash/node';

const logdash = new Logdash(env.LOGDASH_API_KEY);

export const bffLogger = logdash;
