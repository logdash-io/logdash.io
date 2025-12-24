import type { Feature } from '$lib/domains/shared/types.js';

export type Project = {
  id: string;
  name: string;
  members: string[];
  creatorId: string;
  features: Feature[];
  selectedFeatures?: Feature[];
  tier: 'free' | 'early-bird';
};
