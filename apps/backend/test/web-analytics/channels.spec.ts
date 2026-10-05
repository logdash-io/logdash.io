import { createTestApp } from '../utils/bootstrap';
import { WEB_ANALYTICS_CHANNEL } from '../../src/web-analytics/read/web-analytics-channel';

type Visit = {
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  click_id?: string;
};

const CASES: [Visit, string][] = [
  [{ referrer: 'www.google.co.uk' }, 'Organic search'],
  [{ referrer: 'google.com' }, 'Organic search'],
  [{ referrer: 'www.google.com.br' }, 'Organic search'],
  [{ referrer: 'mail.google.com' }, 'Email'],
  [{ referrer: 'com.google.android.gm' }, 'Email'],
  [{ referrer: 'outlook.live.com' }, 'Email'],
  [{ referrer: 'gemini.google.com' }, 'AI assistants'],
  [{ referrer: 'docs.google.com' }, 'Referral'],
  [{ referrer: 'chatgpt.com' }, 'AI assistants'],
  [{ referrer: 'www.perplexity.ai' }, 'AI assistants'],
  [{ referrer: 'l.facebook.com' }, 'Organic social'],
  [{ referrer: 'lm.facebook.com' }, 'Organic social'],
  [{ referrer: 'out.reddit.com' }, 'Organic social'],
  [{ referrer: 'm.youtube.com' }, 'Organic social'],
  [{ referrer: 'news.ycombinator.com' }, 'Organic social'],
  [{ referrer: 't.co' }, 'Organic social'],
  [{ referrer: 'www.pinterest.de' }, 'Organic social'],
  [{ referrer: 'duckduckgo.com' }, 'Organic search'],
  [{ referrer: 'search.brave.com' }, 'Organic search'],
  [{ referrer: 'yandex.ru' }, 'Organic search'],
  [{ referrer: 'yandex.com.tr' }, 'Organic search'],
  [{ referrer: 'cn.bing.com' }, 'Organic search'],
  [{ referrer: 'search.yahoo.co.jp' }, 'Organic search'],
  [{ referrer: 'brave.com' }, 'Referral'],
  [{ referrer: 'someones-blog.dev' }, 'Referral'],
  [{ click_id: 'gclid' }, 'Paid'],
  [{ referrer: 'www.google.com', click_id: 'gad_source' }, 'Paid'],
  [{ referrer: 'www.bing.com', click_id: 'msclkid' }, 'Paid'],
  [{ click_id: 'fbclid' }, 'Organic social'],
  [{ referrer: 'someones-blog.dev', click_id: 'ttclid' }, 'Organic social'],
  [{ utm_source: 'google' }, 'Organic search'],
  [{ utm_source: 'Google', utm_medium: 'CPC' }, 'Paid'],
  [{ utm_source: 'chatgpt.com' }, 'AI assistants'],
  [{ utm_source: 'hn' }, 'Organic social'],
  [{ utm_source: 'acme', utm_medium: 'email' }, 'Email'],
  [{ utm_source: 'acme', utm_medium: 'social-media' }, 'Organic social'],
  [{ utm_medium: 'paid_social' }, 'Paid'],
  [{ utm_medium: 'paid-video', referrer: 'm.youtube.com' }, 'Paid'],
  [{ utm_medium: 'email', referrer: 'l.facebook.com' }, 'Email'],
  [{ utm_source: 'foo' }, 'Campaign'],
  [{ utm_source: 'foo', referrer: 'someones-blog.dev' }, 'Referral'],
  [{ utm_campaign: 'launch' }, 'Direct'],
  [{}, 'Direct'],
];

describe('WEB_ANALYTICS_CHANNEL', () => {
  let bootstrap: Awaited<ReturnType<typeof createTestApp>>;

  beforeAll(async () => {
    bootstrap = await createTestApp();
  });

  afterAll(async () => {
    await bootstrap.methods.afterAll();
  });

  it('classifies visits into channels', async () => {
    // given
    const visits = CASES.map(([visit]) => [
      visit.referrer ?? '',
      visit.utm_source ?? '',
      visit.utm_medium ?? '',
      visit.utm_campaign ?? '',
      visit.click_id ?? '',
    ]);

    // when
    const result = await bootstrap.clickhouseClient.query({
      query: `SELECT ${WEB_ANALYTICS_CHANNEL} AS channel FROM (
        SELECT n, visit[1] AS referrer, visit[2] AS utm_source, visit[3] AS utm_medium,
          visit[4] AS utm_campaign, visit[5] AS click_id
        FROM system.one
        ARRAY JOIN {visits:Array(Array(String))} AS visit, arrayEnumerate({visits:Array(Array(String))}) AS n
      ) ORDER BY n`,
      query_params: { visits },
      format: 'JSONEachRow',
    });
    const rows = await result.json<{ channel: string }>();

    // then
    expect(CASES.map(([visit], index) => [visit, rows[index]?.channel])).toEqual(CASES);
  });
});
