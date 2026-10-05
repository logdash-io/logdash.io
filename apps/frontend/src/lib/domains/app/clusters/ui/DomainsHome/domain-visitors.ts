import type { WebAnalyticsOverview } from '$lib/domains/web-analytics/domain/web-analytics';

export type DomainVisitors =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; overview: WebAnalyticsOverview };
