import nock from 'nock';
import request from 'supertest';
import { assertPublicUrl } from '../../src/shared/ssrf/safe-url';
import { createTestApp } from '../utils/bootstrap';

jest.mock('../../src/shared/ssrf/safe-url', () => ({
  ...jest.requireActual<typeof import('../../src/shared/ssrf/safe-url')>(
    '../../src/shared/ssrf/safe-url',
  ),
  assertPublicUrl: jest.fn(),
}));

const assertPublicUrlMock = assertPublicUrl as jest.MockedFunction<typeof assertPublicUrl>;

const PNG = Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex');
const ICO = Buffer.from('00000100010010100000010020006804', 'hex');

describe('FaviconCoreController (reads)', () => {
  let bootstrap: Awaited<ReturnType<typeof createTestApp>>;

  beforeAll(async () => {
    bootstrap = await createTestApp();
  });

  beforeEach(async () => {
    await bootstrap.methods.beforeEach();
    assertPublicUrlMock.mockReset().mockImplementation((rawUrl: string) =>
      Promise.resolve({
        url: new URL(rawUrl),
        addresses: [{ address: '93.184.215.14', family: 4 as const }],
      }),
    );
  });

  afterAll(async () => {
    await bootstrap.methods.afterAll();
  });

  function readFavicon(hostname: string): request.Test {
    return request(bootstrap.app.getHttpServer())
      .get(`/favicons/${hostname}`)
      .buffer(true)
      .parse((res, done) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => done(null, Buffer.concat(chunks)));
      });
  }

  it('serves the icon the homepage links to and caches it', async () => {
    nock('https://acme.dev').get('/').reply(302, '', { location: 'https://www.acme.dev/en/' });
    nock('https://www.acme.dev')
      .get('/en/')
      .reply(200, '<head><link rel="icon" sizes="48x48" href="icons/48.png"></head>')
      .get('/en/icons/48.png')
      .reply(200, PNG, { 'content-type': 'application/octet-stream' });

    const first = await readFavicon('Acme.dev');
    const second = await readFavicon('acme.dev');

    expect(first.status).toBe(200);
    expect(first.headers['content-type']).toBe('image/png');
    expect(first.headers['cache-control']).toBe('public, max-age=86400');
    expect(first.body).toEqual(PNG);
    expect(second.body).toEqual(PNG);
    expect(nock.isDone()).toBe(true);
  });

  it('serves an inline data url icon', async () => {
    nock('https://inline.dev')
      .get('/')
      .reply(
        200,
        `<link rel="icon" href="data:image/svg+xml,%3csvg%20xmlns='http://www.w3.org/2000/svg'%3e%3c/svg%3e"/>`,
      );

    const response = await readFavicon('inline.dev');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toBe('image/svg+xml');
    expect(response.headers['content-security-policy']).toContain('sandbox');
    expect((response.body as Buffer).toString()).toBe(
      "<svg xmlns='http://www.w3.org/2000/svg'></svg>",
    );
  });

  it('skips a linked icon that is not an image and falls back to favicon.ico', async () => {
    nock('https://spa.dev')
      .get('/')
      .reply(200, '<link rel="icon" href="/missing.png">')
      .get('/missing.png')
      .reply(200, '<!doctype html><html></html>', { 'content-type': 'text/html' })
      .get('/favicon.ico')
      .reply(200, ICO);

    const response = await readFavicon('spa.dev');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toBe('image/x-icon');
    expect(response.body).toEqual(ICO);
  });

  it('falls back to google when the site cannot be crawled', async () => {
    nock('https://blocked.dev').get('/').reply(403).get('/favicon.ico').reply(403);
    nock('https://www.google.com')
      .get('/s2/favicons')
      .query({ domain: 'blocked.dev', sz: '64' })
      .reply(200, PNG);

    const response = await readFavicon('blocked.dev');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(PNG);
  });

  it('returns 404 and remembers it when no icon exists anywhere', async () => {
    nock('https://empty.dev').get('/').reply(200, '<html></html>').get('/favicon.ico').reply(404);
    nock('https://www.google.com')
      .get('/s2/favicons')
      .query({ domain: 'empty.dev', sz: '64' })
      .reply(404, PNG);

    expect((await readFavicon('empty.dev')).status).toBe(404);
    expect((await readFavicon('empty.dev')).status).toBe(404);
    expect(nock.isDone()).toBe(true);
  });

  it('never fetches anything for a value that is not a public hostname', async () => {
    expect((await readFavicon('localhost')).status).toBe(404);
    expect((await readFavicon('127.0.0.1')).status).toBe(404);
    expect((await readFavicon('Direct')).status).toBe(404);
    expect(assertPublicUrlMock).not.toHaveBeenCalled();
  });
});
