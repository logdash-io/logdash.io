import { expect, test } from '@playwright/test';
import type { Cluster } from './cluster';
import { ownedUsage } from './owned-usage';

const cluster = (
  creatorId: string,
  services: number,
  statusPages: { isPublic: boolean }[] = [],
): Cluster => ({
  id: `${creatorId}-${services}-${statusPages.length}`,
  name: 'Domain',
  members: [],
  creatorId,
  tier: 'free',
  projects: Array.from({ length: services }, (_, index) => ({
    id: `service-${index}`,
    name: `Service ${index}`,
    features: [],
  })),
  publicDashboards: statusPages.map((page, index) => ({
    id: `page-${index}`,
    name: `Page ${index}`,
    isPublic: page.isPublic,
  })),
});

test('counts only domains the user created, drafts included', () => {
  const clusters = [
    cluster('me', 2, [{ isPublic: false }]),
    cluster('me', 1, [{ isPublic: true }]),
    cluster('teammate', 5, [{ isPublic: true }, { isPublic: false }]),
  ];

  expect(ownedUsage(clusters, 'me')).toEqual({
    domains: 2,
    services: 3,
    statusPages: 2,
  });
});

test('treats domains the API sends without services or status pages as empty', () => {
  const bare = {
    ...cluster('me', 0),
    projects: undefined,
    publicDashboards: undefined,
  } as unknown as Cluster;

  expect(ownedUsage([bare], 'me')).toEqual({
    domains: 1,
    services: 0,
    statusPages: 0,
  });
});

test('owns nothing before the user is known', () => {
  expect(ownedUsage([cluster('me', 3)], undefined)).toEqual({
    domains: 0,
    services: 0,
    statusPages: 0,
  });
});
