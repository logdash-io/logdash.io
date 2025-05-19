import type { Feature } from '$lib/shared/types';

export type ClusterProjectReadModel = {
	id: string;
	name: string;
	features: Feature[];
};
