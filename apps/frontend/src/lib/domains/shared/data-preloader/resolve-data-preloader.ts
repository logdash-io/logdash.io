import type { DataPreloader } from '$lib/domains/shared/data-preloader/data-preloader';
import type { ServerLoadEvent } from '@sveltejs/kit';

export const resolve_data_preloader = <T>(
  preloader: new () => DataPreloader<T>,
): ((event: ServerLoadEvent) => Promise<T>) => {
  const instance = new preloader();
  return (event) => instance.preload(event);
};
