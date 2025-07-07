import type { ServerLoadEvent } from '@sveltejs/kit';

export interface DataPreloader<T> {
	preload(event: ServerLoadEvent): Promise<T>;
}
