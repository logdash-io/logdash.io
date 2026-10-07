import { clustersState } from '$lib/domains/app/clusters/application/clusters.state.svelte.js';
import {
  DOMAIN_SETUP_COOKIE,
  DOMAIN_SETUP_COOKIE_MAX_AGE,
  parseDomainSetups,
  serializeDomainSetups,
} from '$lib/domains/app/clusters/domain/domain-setup';
import { PROJECT_COLORS } from '$lib/domains/app/clusters/domain/project-colors';
import { ClustersService } from '$lib/domains/app/clusters/infrastructure/clusters.service.js';
import { monitoringState } from '$lib/domains/app/projects/application/monitoring.state.svelte.js';
import { MonitorMode } from '$lib/domains/app/projects/domain/monitoring/monitor-mode.js';
import {
  clusterNameFromUrl,
  previewNameFromUrl,
} from '$lib/domains/shared/utils/address-names';
import { getCookieValue } from '$lib/domains/shared/utils/client-cookies.utils.js';
import { tryPrependProtocol } from '$lib/domains/shared/utils/url';

export async function createDomain(address: string): Promise<string> {
  const url = tryPrependProtocol(address.trim());
  const cluster = await ClustersService.createCluster({
    name: await clusterNameFromUrl(url),
    color:
      PROJECT_COLORS[clustersState.clusters.length % PROJECT_COLORS.length],
  });

  try {
    await addMonitoredAddress(cluster.id, url);
  } catch (error) {
    await ClustersService.deleteCluster(cluster.id).catch(() => undefined);
    throw error;
  }

  startDomainSetup(cluster.id);
  window.logdash?.track('domain_created');

  return cluster.id;
}

export async function addMonitoredAddress(
  clusterId: string,
  address: string,
): Promise<string> {
  const url = tryPrependProtocol(address.trim());
  const monitorId = await monitoringState.createMonitor(clusterId, {
    name: previewNameFromUrl(url),
    mode: MonitorMode.PULL,
    url,
  });
  await monitoringState.claimMonitor(monitorId);

  return monitorId;
}

export function startDomainSetup(clusterId: string): void {
  writeDomainSetups([...readDomainSetups(), clusterId]);
}

export function finishDomainSetup(clusterId: string): void {
  writeDomainSetups(readDomainSetups().filter((id) => id !== clusterId));
}

function readDomainSetups(): string[] {
  return parseDomainSetups(
    getCookieValue(DOMAIN_SETUP_COOKIE, document.cookie),
  );
}

function writeDomainSetups(ids: string[]): void {
  document.cookie = `${DOMAIN_SETUP_COOKIE}=${serializeDomainSetups(ids)}; path=/app; max-age=${DOMAIN_SETUP_COOKIE_MAX_AGE}; samesite=lax`;
}
