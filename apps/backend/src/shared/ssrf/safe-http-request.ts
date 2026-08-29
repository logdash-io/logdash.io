import { LookupOptions } from 'node:dns';
import { Agent as HttpAgent } from 'node:http';
import { Agent as HttpsAgent } from 'node:https';
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { VettedAddress, assertPublicUrl } from './safe-url';

const MAX_REDIRECTS = 5;
const REDIRECT_STATUS_CODES = [301, 302, 303, 307, 308];

/**
 * One deadline for the whole redirect chain. A per hop timeout would let a
 * hostile endpoint hold a worker for MAX_REDIRECTS + 1 timeout windows by
 * answering slowly with a redirect every time.
 */
const DEFAULT_TOTAL_TIMEOUT_MS = 30_000;

/**
 * Hard cap on the response body we are willing to buffer, applied to every hop.
 * Not overridable by callers - the url is user supplied, so the peer must not be
 * able to decide how much memory we allocate for it.
 */
const MAX_RESPONSE_BYTES = 5 * 1024 * 1024;

/**
 * Dropped when a redirect leaves the origin the request was aimed at. Webhook
 * channels let users configure arbitrary headers, which commonly carry a token
 * for the receiver; replaying them to whatever host answers with a `Location`
 * would hand that token to a third party.
 */
const CREDENTIAL_HEADERS = ['authorization', 'cookie', 'proxy-authorization', 'www-authenticate'];

const defaultValidateStatus = (status: number): boolean => status >= 200 && status < 300;

type HeadersRecord = Record<string, unknown>;

function filterHeaders(
  headers: AxiosRequestConfig['headers'],
  shouldDrop: (lowercaseName: string) => boolean,
): AxiosRequestConfig['headers'] {
  if (!headers) {
    return headers;
  }

  const entries = Object.entries(headers as HeadersRecord).filter(
    ([name]) => !shouldDrop(name.toLowerCase()),
  );

  return Object.fromEntries(entries) as AxiosRequestConfig['headers'];
}

/**
 * Mirrors what `follow-redirects` does for us when axios handles redirects
 * itself: 303 always becomes a bodyless GET, and 301/302 do the same for POST.
 */
function downgradesToGet(status: number, method: string): boolean {
  if (status === 303) return method !== 'GET' && method !== 'HEAD';
  if (status === 301 || status === 302) return method === 'POST';

  return false;
}

/**
 * A `lookup` that resolves every hostname to the addresses the ssrf guard
 * already vetted, instead of asking dns a second time. Passed to the connection
 * agent so the socket goes to one of those addresses while the `Host` header and
 * TLS SNI keep the original hostname.
 */
function pinnedLookup(addresses: VettedAddress[]) {
  return (_hostname: string, options: unknown, callback?: (...args: unknown[]) => void): void => {
    const done = (typeof options === 'function' ? options : callback) as (
      ...args: unknown[]
    ) => void;
    const requested =
      typeof options === 'object' && options !== null ? (options as LookupOptions) : {};
    const candidates =
      requested.family === 4 || requested.family === 6
        ? addresses.filter((entry) => entry.family === requested.family)
        : addresses;

    if (candidates.length === 0) {
      done(new Error(`No vetted address for the requested family ${requested.family}`));
      return;
    }

    if (requested.all) {
      done(null, candidates);
    } else {
      done(null, candidates[0].address, candidates[0].family);
    }
  };
}

/**
 * axios wrapper for user supplied urls. Redirects are never followed by axios
 * itself, every hop is resolved and re-checked against the ssrf guard before
 * the request is made, so a 302 into the private network is rejected.
 */
export async function safeHttpRequest(
  config: AxiosRequestConfig & { url: string },
): Promise<AxiosResponse> {
  const validateStatus =
    config.validateStatus === undefined ? defaultValidateStatus : config.validateStatus;

  const deadline = Date.now() + (config.timeout || DEFAULT_TOTAL_TIMEOUT_MS);

  let currentUrl = config.url;
  let method = (config.method ?? 'GET').toString().toUpperCase();
  let headers = config.headers;
  let data = config.data;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const remainingMs = deadline - Date.now();

    if (remainingMs <= 0) {
      throw new AxiosError(
        `Request to ${config.url} timed out after ${config.timeout || DEFAULT_TOTAL_TIMEOUT_MS}ms`,
        AxiosError.ETIMEDOUT,
      );
    }

    const { addresses } = await assertPublicUrl(currentUrl);
    const lookup = pinnedLookup(addresses);
    const httpAgent = new HttpAgent({ lookup });
    const httpsAgent = new HttpsAgent({ lookup });

    let response: AxiosResponse;
    try {
      response = await axios.request({
        ...config,
        url: currentUrl,
        method,
        headers,
        data,
        // everything below is deliberately after the spread so a caller cannot
        // weaken the guarantees this wrapper exists to provide
        httpAgent,
        httpsAgent,
        timeout: remainingMs,
        maxRedirects: 0,
        maxContentLength: MAX_RESPONSE_BYTES,
        maxBodyLength: MAX_RESPONSE_BYTES,
        validateStatus: () => true,
      });
    } finally {
      httpAgent.destroy();
      httpsAgent.destroy();
    }

    const location = response.headers?.location as string | undefined;

    if (REDIRECT_STATUS_CODES.includes(response.status) && location) {
      const nextUrl = new URL(location, currentUrl);
      const crossOrigin = nextUrl.origin !== new URL(currentUrl).origin;

      if (crossOrigin) {
        headers = filterHeaders(headers, (name) => CREDENTIAL_HEADERS.includes(name));
      }

      if (downgradesToGet(response.status, method)) {
        method = 'GET';
        data = undefined;
        headers = filterHeaders(headers, (name) => name.startsWith('content-'));
      }

      currentUrl = nextUrl.toString();
      continue;
    }

    if (validateStatus && !validateStatus(response.status)) {
      throw new AxiosError(
        `Request failed with status code ${response.status}`,
        response.status >= 500 ? AxiosError.ERR_BAD_RESPONSE : AxiosError.ERR_BAD_REQUEST,
        response.config,
        response.request,
        response,
      );
    }

    return response;
  }

  throw new Error(`Blocked request to ${config.url}: exceeded ${MAX_REDIRECTS} redirects`);
}
