const SAME_SITE_FETCH_SITES = ['same-origin', 'none'];

export const is_same_site_request = (request: Request): boolean =>
  SAME_SITE_FETCH_SITES.includes(request.headers.get('sec-fetch-site') ?? '');
