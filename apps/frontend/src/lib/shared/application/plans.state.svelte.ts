// import { source, type Source } from 'sveltekit-sse';
// import { arrayToObject } from '$lib/shared/utils/array-to-object';
// import type { Feature, UserTier } from '$lib/shared/types.js';
// import { toast } from '$lib/shared/ui/toaster/toast.state.svelte.js';

// // "free": {
// // 	"logs": {
// // 	"keepLastXLogs": 1000,
// // 	"rateLimitPerHour": 10000
// // 	},
// // 	"logMetrics": {
// // 	"keepGranularitiesForHours": {
// // 		"minute": 1,
// // 		"hour": 12,
// // 		"day": 168
// // 	}
// // 	},
// // 	"metrics": {
// // 	"maxMetricsRegisterEntries": 2,
// // 	"keepGranularitiesForHours": {
// // 		"minute": 1,
// // 		"hour": 12,
// // 		"day": 168
// // 	}
// // 	},
// // 	"httpMonitors": {
// // 	"pingResponseTimeGranularityMs": 100
// // 	}
// // }

// type PlanConfig = Record<
// 	UserTier,
// 	{
// 		logs: {
// 			keepLastXLogs: number;
// 			rateLimitPerHour: number;
// 		};
// 		logMetrics: {
// 			keepGranularitiesForHours: {
// 				minute: number;
// 				hour: number;
// 				day: number;
// 			};
// 		};
// 		metrics: {
// 			maxMetricsRegisterEntries: number;
// 			keepGranularitiesForHours: {
// 				minute: number;
// 				hour: number;
// 				day: number;
// 			};
// 		};
// 		httpMonitors: {
// 			pingResponseTimeGranularityMs: number;
// 		};
// 	}
// >;

// type ExposedConfig = Record<'planConfigs', PlanConfig>;

// // todo: divide api calls responsibility from state
// class PlansState {
// 	private _clusters = $state<Record<Cluster['id'], Cluster>>({});
// 	private _initialized = $state(false);
// 	private syncConnection: Source | null = null;

// 	get clusters(): Cluster[] {
// 		return Object.values(this._clusters).sort((a, b) => {
// 			return a.id > b.id ? 1 : -1;
// 		});
// 	}

// 	get ready(): boolean {
// 		return this._initialized;
// 	}

// 	clusterName(id: string): string {
// 		return this._clusters[id]?.name || '';
// 	}

// 	hasFeature(clusterId: string, feature: Feature.MONITORING): boolean {
// 		return this._clusters[clusterId]?.features.includes(feature);
// 	}

// 	set(clusters: Cluster[]): void {
// 		this._clusters = arrayToObject(clusters, 'id');
// 		this._initialized = true;
// 	}

// 	create(name: string): Promise<Cluster['id']> {
// 		return fetch(`/app/api/clusters`, {
// 			method: 'POST',
// 			headers: {
// 				'Content-Type': 'application/json',
// 			},
// 			body: JSON.stringify({ name }),
// 		})
// 			.then((response) => response.json())
// 			.then(({ id }) => id);
// 	}

// 	async update(id: string, update: Partial<Cluster>): Promise<void> {
// 		const existingCluster = this._clusters[id];

// 		if (!existingCluster) {
// 			throw new Error(`Cluster with id ${id} does not exist`);
// 		}

// 		if (existingCluster.name === update.name) {
// 			return Promise.resolve();
// 		}

// 		this._clusters[id].name = update.name;

// 		await fetch(`/app/api/clusters/${id}`, {
// 			method: 'PUT',
// 			headers: {
// 				'Content-Type': 'application/json',
// 			},
// 			body: JSON.stringify(update),
// 		}).catch((error) => {
// 			toast.error(`Failed to update cluster ${id}: ${error.message}`);
// 		});
// 	}
// }

// export const clustersState = new ClustersState();
