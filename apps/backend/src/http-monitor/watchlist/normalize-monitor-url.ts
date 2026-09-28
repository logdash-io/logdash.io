export function normalizeMonitorUrl(url: string): string {
  const { host, pathname, search } = new URL(url);

  return `${host.replace(/^www\./, '')}${pathname.replace(/\/$/, '')}${search}`;
}
