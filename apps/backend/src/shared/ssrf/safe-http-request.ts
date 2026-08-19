import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { assertPublicUrl } from './safe-url';

const MAX_REDIRECTS = 5;
const REDIRECT_STATUS_CODES = [301, 302, 303, 307, 308];

const defaultValidateStatus = (status: number): boolean => status >= 200 && status < 300;

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

  let currentUrl = config.url;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertPublicUrl(currentUrl);

    const response = await axios.request({
      ...config,
      url: currentUrl,
      maxRedirects: 0,
      validateStatus: () => true,
    });

    const location = response.headers?.location as string | undefined;

    if (REDIRECT_STATUS_CODES.includes(response.status) && location) {
      currentUrl = new URL(location, currentUrl).toString();
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
