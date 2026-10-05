import nock from 'nock';
import request from 'supertest';
import { createTestApp } from '../utils/bootstrap';
import { assertPublicUrl } from '../../src/shared/ssrf/safe-url';
import { SuggestHttpMonitorUrlsResponse } from '../../src/http-monitor/core/dto/suggest-http-monitor-urls.response';

jest.mock('../../src/shared/ssrf/safe-url', () => ({
  ...jest.requireActual<typeof import('../../src/shared/ssrf/safe-url')>(
    '../../src/shared/ssrf/safe-url',
  ),
  assertPublicUrl: jest.fn(),
}));

const assertPublicUrlMock = assertPublicUrl as jest.MockedFunction<typeof assertPublicUrl>;

const PAGE = '<!doctype html><title>Example</title>';

describe('HttpMonitorCoreController (suggestions)', () => {
  let bootstrap: Awaited<ReturnType<typeof createTestApp>>;
  let resolvingHosts: string[];

  beforeAll(async () => {
    bootstrap = await createTestApp();
  });

  beforeEach(async () => {
    await bootstrap.methods.beforeEach();
    resolvingHosts = ['example.com'];
    assertPublicUrlMock.mockReset().mockImplementation((rawUrl: string) => {
      const url = new URL(rawUrl);

      if (!resolvingHosts.includes(url.hostname) && !url.hostname.startsWith('logdash-probe-')) {
        return Promise.reject(new Error('ENOTFOUND'));
      }

      if (url.hostname.startsWith('logdash-probe-') && !resolvingHosts.includes('*')) {
        return Promise.reject(new Error('ENOTFOUND'));
      }

      return Promise.resolve({
        url,
        addresses: [{ address: '93.184.215.14', family: 4 as const }],
      });
    });
    nock('https://example.com').get('/').reply(200, PAGE).persist();
    nock('https://example.com')
      .get(/^\/logdash-probe-/)
      .reply(404, 'Not found')
      .persist();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  afterAll(async () => {
    await bootstrap.methods.afterAll();
  });

  const suggest = (token: string, clusterId: string): request.Test =>
    request(bootstrap.app.getHttpServer())
      .post(`/clusters/${clusterId}/http_monitors/suggestions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ url: 'https://example.com' });

  it('suggests subdomains that answer on their own and health paths', async () => {
    // given
    const { token, cluster } = await bootstrap.utils.generalUtils.setupAnonymous();
    resolvingHosts.push('api.example.com', 'app.example.com');
    nock('https://api.example.com').get('/').reply(200, { ok: true });
    nock('https://app.example.com').get('/').reply(301, '', { location: 'https://example.com/' });
    nock('https://example.com').get('/health').reply(200, 'ok');
    nock('https://example.com').get('/api/health').reply(404, 'Not found');
    nock('https://example.com').get('/up').reply(404, 'Not found');

    // when
    const response = await suggest(token, cluster.id);

    // then
    expect(response.status).toBe(200);
    expect((response.body as SuggestHttpMonitorUrlsResponse).urls).toEqual([
      'https://api.example.com/',
      'https://example.com/health',
    ]);
  });

  it('suggests no subdomains when the domain answers any made up subdomain', async () => {
    // given
    const { token, cluster } = await bootstrap.utils.generalUtils.setupAnonymous();
    resolvingHosts.push('*', 'api.example.com');
    nock(/logdash-probe-[0-9a-f]{8}\.example\.com/)
      .get('/')
      .reply(200, PAGE);
    nock('https://api.example.com').get('/').reply(200, PAGE);
    nock('https://example.com')
      .get(/^\/(health|api\/health|up)$/)
      .times(3)
      .reply(404, 'Not found');

    // when
    const response = await suggest(token, cluster.id);

    // then
    expect((response.body as SuggestHttpMonitorUrlsResponse).urls).toEqual([]);
  });

  it('rejects a user from another domain', async () => {
    // given
    const { cluster } = await bootstrap.utils.generalUtils.setupAnonymous();
    const other = await bootstrap.utils.generalUtils.setupAnonymous();

    // when
    const response = await suggest(other.token, cluster.id);

    // then
    expect(response.status).toBe(403);
  });
});
