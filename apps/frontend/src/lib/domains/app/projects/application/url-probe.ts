import { monitoringService } from '$lib/domains/app/projects/infrastructure/monitoring.service';
import type { UrlProbe } from '$lib/domains/app/projects/domain/monitoring/url-hint';

const probes = new Map<string, Promise<UrlProbe>>();

export function probeUrl(projectId: string, url: string): Promise<UrlProbe> {
  const cached = probes.get(url);

  if (cached) {
    return cached;
  }

  const probe = requestProbe(projectId, url);
  probes.set(url, probe);

  return probe;
}

export function isCatchAllWarningDismissed(monitorId: string): boolean {
  if (typeof localStorage === 'undefined') {
    return false;
  }

  return localStorage.getItem(catchAllDismissedKey(monitorId)) !== null;
}

export function dismissCatchAllWarning(monitorId: string): void {
  localStorage.setItem(catchAllDismissedKey(monitorId), '1');
}

async function requestProbe(projectId: string, url: string): Promise<UrlProbe> {
  try {
    return await monitoringService.probeUrl(projectId, url);
  } catch (error) {
    probes.delete(url);
    throw error;
  }
}

function catchAllDismissedKey(monitorId: string): string {
  return `catch_all_warning_dismissed_${monitorId}`;
}
