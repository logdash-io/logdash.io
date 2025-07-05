import type { DataPreloader } from '$lib/domains/shared/data-preloader/data-preloader';

export const resolve_data_preloader = <T>(
  preloader: new () => DataPreloader<T>,
) => new preloader().preload;
