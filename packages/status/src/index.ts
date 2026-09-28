import type { components } from './api.generated.ts';

type Schemas = components['schemas'];

export type StatusPage = Schemas['StatusPageDto'];
export type Monitor = Schemas['StatusPageMonitorDto'];
export type Bucket = Schemas['StatusPageBucketDto'];
export type Ping = Schemas['StatusPagePingDto'];
