import { ClickhouseUtils } from '../../../clickhouse/clickhouse.utils';
import { CLICK_IDS, WebEventBody } from '../dto/collect-web-events.body';
import { WebAnalyticsSiteNormalized } from './web-analytics-site.interface';
import { TIMEZONE_COUNTRIES } from './timezone-countries';

export class WebEventClickhouseEntity {
  id: string;
  cluster_id: string;
  site_id: string;
  visitor_id: string;
  session_id: string;
  user_id: string;
  created_at: string;
  received_at: string;
  expires_at: string;
  name: string;
  hostname: string;
  path: string;
  referrer: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_term: string;
  click_id: string;
  device: string;
  browser: string;
  os: string;
  country: string;

  public static fromNormalized(
    event: WebEventBody,
    site: WebAnalyticsSiteNormalized,
    origin: string,
    userAgent: string,
    retentionDays: number,
    sentAt: Date,
    now: Date,
  ): WebEventClickhouseEntity | null {
    const age = Math.max(0, sentAt.getTime() - Date.parse(event.timestamp));
    const path = this.normalizePath(event.path);
    if (!(age <= 5 * 60_000) || path === null) return null;
    const createdAt = new Date(now.getTime() - age);
    const campaign = (value?: string): string =>
      !value || /[@\p{Cc}]/u.test(value) ? '' : Array.from(value.trim()).slice(0, 100).join('');
    return {
      id: event.id,
      cluster_id: site.clusterId,
      site_id: site.id,
      visitor_id: '',
      session_id: '',
      user_id: event.userId ?? '',
      created_at: ClickhouseUtils.jsDateToClickhouseDate(createdAt),
      received_at: ClickhouseUtils.jsDateToClickhouseDate(now),
      expires_at: ClickhouseUtils.jsDateToClickhouseDate(
        new Date(createdAt.getTime() + retentionDays * 86_400_000),
      ).slice(0, 19),
      name: event.name,
      hostname: new URL(origin).hostname,
      path,
      referrer:
        event.referrer &&
        /^[a-zA-Z0-9.-]{1,255}$/.test(event.referrer) &&
        event.referrer !== new URL(origin).hostname
          ? event.referrer.toLowerCase()
          : '',
      utm_source: campaign(event.utmSource),
      utm_medium: campaign(event.utmMedium),
      utm_campaign: campaign(event.utmCampaign),
      utm_term: campaign(event.utmTerm),
      click_id: event.clickId && CLICK_IDS.includes(event.clickId) ? event.clickId : '',
      device: /ipad|tablet/i.test(userAgent)
        ? 'Tablet'
        : /mobile|iphone|android/i.test(userAgent)
          ? 'Mobile'
          : 'Desktop',
      browser: this.browser(userAgent),
      os: this.os(userAgent),
      country: TIMEZONE_COUNTRIES[event.timezone ?? ''] ?? '',
    };
  }

  private static browser(userAgent: string): string {
    if (/edg(e|a|ios)?\//i.test(userAgent)) return 'Edge';
    if (/opr\/|opera/i.test(userAgent)) return 'Opera';
    if (/samsungbrowser/i.test(userAgent)) return 'Samsung Internet';
    if (/firefox|fxios/i.test(userAgent)) return 'Firefox';
    if (/chrome|crios|chromium/i.test(userAgent)) return 'Chrome';
    if (/safari/i.test(userAgent)) return 'Safari';
    return 'Other';
  }

  private static os(userAgent: string): string {
    if (/iphone|ipad|ipod/i.test(userAgent)) return 'iOS';
    if (/android/i.test(userAgent)) return 'Android';
    if (/cros/i.test(userAgent)) return 'ChromeOS';
    if (/windows/i.test(userAgent)) return 'Windows';
    if (/mac os x|macintosh/i.test(userAgent)) return 'macOS';
    if (/linux/i.test(userAgent)) return 'Linux';
    return 'Other';
  }

  private static normalizePath(value: string): string | null {
    if (!value.startsWith('/') || value.startsWith('//')) return null;
    return (
      value
        .split(/[?#]/, 1)[0]
        .split('/')
        .map((part) => {
          let decoded: string;
          try {
            decoded = decodeURIComponent(part);
          } catch {
            return ':redacted';
          }
          if (/@/.test(decoded)) return ':redacted';
          if (/^(?:[0-9a-f]{24}|[0-9a-f]{8}-[0-9a-f-]{27}|\d{4,})$/i.test(decoded)) return ':id';
          return part;
        })
        .join('/') || '/'
    );
  }
}
