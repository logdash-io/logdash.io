import { env } from '$env/dynamic/private';
import { Logdash } from '@logdash/node';

let instance: Logdash | undefined;

export function logger(): Logdash {
	if (!env.LOGDASH_API_KEY) {
		throw new Error(
			'LOGDASH_API_KEY is not set. The status page server sends its logs and metrics to Logdash with this server-only ingest key.'
		);
	}

	instance ??= new Logdash(env.LOGDASH_API_KEY).withNamespace('status-page');

	return instance;
}
