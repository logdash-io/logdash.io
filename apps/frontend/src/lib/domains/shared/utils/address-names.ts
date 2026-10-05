import { displayUrl, urlHost } from '$lib/domains/shared/utils/url';

const MAX_NAME_LENGTH = 64;

export const previewNameFromUrl = (url: string): string =>
  displayUrl(url).slice(0, MAX_NAME_LENGTH).replace(/\/+$/, '');

export const clusterNameFromUrl = async (url: string): Promise<string> => {
  const host = urlHost(url) ?? url;

  try {
    const { registrableDomain } = await import(
      '$lib/domains/shared/utils/registrable-domain'
    );

    return registrableDomain(host).slice(0, MAX_NAME_LENGTH);
  } catch {
    return host.slice(0, MAX_NAME_LENGTH);
  }
};
