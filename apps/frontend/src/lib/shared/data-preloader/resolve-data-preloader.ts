import type { DataPreloader } from './data-preloader';

export const resolve_data_preloader = <T>(
	preloader: new () => DataPreloader<T>,
) => new preloader().preload;
