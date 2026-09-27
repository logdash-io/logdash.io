import { envConfig } from "../../../utils/env-config";

const FORWARDED_SEARCH_PARAMS = ["style", "period", "theme"];
const FORWARDED_REQUEST_HEADERS = ["if-none-match"];
const FORWARDED_RESPONSE_HEADERS = [
  "cache-control",
  "content-security-policy",
  "content-type",
  "etag",
];

export class PublicDashboardBadgeService {
  static async fetchBadge(
    dashboardIdOrDomain: string,
    badgeKey: string,
    request: Request
  ): Promise<Response> {
    const response = await fetch(
      `${envConfig.apiBaseUrl}/public_dashboards/${encodeURIComponent(
        dashboardIdOrDomain
      )}/badges/${encodeURIComponent(badgeKey)}.svg?${pickSearchParams(
        new URL(request.url).searchParams
      )}`,
      { headers: pickHeaders(request.headers, FORWARDED_REQUEST_HEADERS) }
    );

    return new Response(response.body, {
      status: response.status,
      headers: pickHeaders(response.headers, FORWARDED_RESPONSE_HEADERS),
    });
  }
}

function pickSearchParams(searchParams: URLSearchParams): URLSearchParams {
  const picked = new URLSearchParams();

  for (const name of FORWARDED_SEARCH_PARAMS) {
    const value = searchParams.get(name);

    if (value) {
      picked.set(name, value);
    }
  }

  return picked;
}

function pickHeaders(headers: Headers, names: string[]): Headers {
  const picked = new Headers();

  for (const name of names) {
    const value = headers.get(name);

    if (value) {
      picked.set(name, value);
    }
  }

  return picked;
}
