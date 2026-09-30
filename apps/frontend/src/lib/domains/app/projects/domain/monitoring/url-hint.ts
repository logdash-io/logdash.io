import {
  isValidUrl,
  tryPrependProtocol,
  urlPath,
} from '../../../../shared/utils/url.js';

export type UrlProbe = {
  catchAll: boolean;
  healthPaths: string[];
};

export type UrlHint =
  | { kind: 'catch-all'; healthPaths: string[] }
  | { kind: 'health-paths'; healthPaths: string[] }
  | { kind: 'suggest-health' }
  | { kind: 'none' };

export function urlHint(url: string, probe: UrlProbe | null): UrlHint {
  if (!isValidUrl(url.trim())) {
    return { kind: 'none' };
  }

  if (probe?.catchAll) {
    return { kind: 'catch-all', healthPaths: probe.healthPaths };
  }

  if (urlPath(url) !== '/') {
    return { kind: 'none' };
  }

  if (probe && probe.healthPaths.length > 0) {
    return { kind: 'health-paths', healthPaths: probe.healthPaths };
  }

  return { kind: 'suggest-health' };
}

export function withPath(url: string, path: string): string {
  return `${new URL(tryPrependProtocol(url.trim())).origin}${path}`;
}
