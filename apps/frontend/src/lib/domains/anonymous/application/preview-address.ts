import { goto, replaceState } from '$app/navigation';
import { resolve } from '$app/paths';
import { page } from '$app/state';

const ADDRESS_PARAM = 'url';
const ADDRESS_PATH = 'for/';

/**
 * `/for/acme.com` is the readable address of a preview, the one people read in
 * an email before clicking. `?url=` stays as the form's no-JS fallback.
 */
export function previewPath(address: string): string {
  const bare = address
    .trim()
    .replace(/^https:\/\//i, '')
    .replace(/\/+$/, '');
  const encoded = encodeURIComponent(bare);

  // `http://` keeps its slashes encoded, a `//` in a path does not survive every hop.
  return `${resolve('/')}${ADDRESS_PATH}${
    /^http:/i.test(bare)
      ? encoded
      : encoded.replace(/%2F/g, '/').replace(/%3A/g, ':')
  }`;
}

export function addressFromPath(pathname: string): string | null {
  const prefix = `${resolve('/')}${ADDRESS_PATH}`;

  return pathname.startsWith(prefix)
    ? decodeURIComponent(pathname.slice(prefix.length)).trim() || null
    : null;
}

export function readPreviewAddress(): string | null {
  const { pathname, searchParams } = new URL(location.href);

  return (
    addressFromPath(pathname) ??
    (searchParams.get(ADDRESS_PARAM)?.trim() || null)
  );
}

export async function openPreviewAddress(address: string): Promise<void> {
  // eslint-disable-next-line svelte/no-navigation-without-resolve
  await goto(previewPath(address));
}

export function writePreviewAddress(address: string | null): void {
  const url = new URL(location.href);
  url.searchParams.delete(ADDRESS_PARAM);

  if (address) {
    url.pathname = previewPath(address);
  } else if (addressFromPath(url.pathname)) {
    url.pathname = resolve('/');
  }

  if (url.href === location.href) {
    return;
  }

  // eslint-disable-next-line svelte/no-navigation-without-resolve
  replaceState(url, page.state);
}
