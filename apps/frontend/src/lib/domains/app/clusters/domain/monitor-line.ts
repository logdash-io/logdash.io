import { displayUrl } from '$lib/domains/shared/utils/url';

export type MonitorLine = {
  tone: 'up' | 'down' | 'idle';
  text: string;
};

export function monitorLine(
  ping: { statusCode: number; responseTimeMs: number } | undefined,
  monitor: { lastStatus: 'up' | 'down' | 'unknown'; lastStatusCode: number },
): MonitorLine {
  if (!ping && monitor.lastStatus === 'unknown') {
    return { tone: 'idle', text: 'Checking…' };
  }

  const statusCode = ping?.statusCode ?? monitor.lastStatusCode;

  if (!statusCode) {
    return { tone: 'down', text: 'Not answering' };
  }

  if (statusCode >= 400) {
    return { tone: 'down', text: `Down · ${statusCode}` };
  }

  return { tone: 'up', text: ping ? `Up · ${ping.responseTimeMs} ms` : 'Up' };
}

export function newSuggestions(
  suggestions: string[],
  monitoredUrls: string[],
): string[] {
  const monitored = new Set(monitoredUrls.map(displayUrl));

  return suggestions.filter((url) => !monitored.has(displayUrl(url)));
}
