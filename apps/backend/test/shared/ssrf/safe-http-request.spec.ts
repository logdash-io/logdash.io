import { AddressInfo } from 'node:net';
import { IncomingMessage, Server, ServerResponse, createServer } from 'node:http';
import { assertPublicUrl } from '../../../src/shared/ssrf/safe-url';
import { safeHttpRequest } from '../../../src/shared/ssrf/safe-http-request';

jest.mock('../../../src/shared/ssrf/safe-url', () => ({
  ...jest.requireActual('../../../src/shared/ssrf/safe-url'),
  assertPublicUrl: jest.fn(),
}));

const assertPublicUrlMock = assertPublicUrl as jest.MockedFunction<typeof assertPublicUrl>;

type Handler = (req: IncomingMessage, res: ServerResponse) => void;

interface TestServer {
  server: Server;
  port: number;
  requests: { url: string; method: string; headers: NodeJS.Dict<string>; body: string }[];
}

async function startServer(handler: Handler): Promise<TestServer> {
  const requests: TestServer['requests'] = [];

  const server = createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      requests.push({
        url: req.url!,
        method: req.method!,
        headers: req.headers as NodeJS.Dict<string>,
        body: Buffer.concat(chunks).toString(),
      });
      handler(req, res);
    });
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));

  return { server, port: (server.address() as AddressInfo).port, requests };
}

describe('safeHttpRequest', () => {
  const servers: TestServer[] = [];

  /**
   * The guard rejects loopback, so the vetted address is stubbed here. The
   * hostname handed to safeHttpRequest deliberately does not resolve in dns -
   * every request that succeeds proves the connection went to the pinned
   * address rather than to a second, unvetted resolution of the hostname.
   */
  function pinToLoopback(): void {
    assertPublicUrlMock.mockImplementation(async (rawUrl: string) => ({
      url: new URL(rawUrl),
      addresses: [{ address: '127.0.0.1', family: 4 as const }],
    }));
  }

  async function serve(handler: Handler): Promise<TestServer> {
    const started = await startServer(handler);
    servers.push(started);

    return started;
  }

  beforeEach(() => {
    assertPublicUrlMock.mockReset();
  });

  afterEach(async () => {
    await Promise.all(
      servers.splice(0).map((s) => new Promise<void>((resolve) => s.server.close(() => resolve()))),
    );
  });

  it('connects to the address the guard vetted, not to a fresh dns resolution', async () => {
    const target = await serve((_req, res) => {
      res.writeHead(200).end('ok');
    });
    pinToLoopback();

    // `pinned.invalid` can never resolve - .invalid is reserved by RFC 2606
    const response = await safeHttpRequest({ url: `http://pinned.invalid:${target.port}/` });

    expect(response.status).toBe(200);
    expect(target.requests[0].headers.host).toBe(`pinned.invalid:${target.port}`);
  });

  it('drops credential headers on a cross origin redirect', async () => {
    const attacker = await serve((_req, res) => {
      res.writeHead(200).end('ok');
    });
    const origin = await serve((_req, res) => {
      res.writeHead(302, { location: `http://attacker.invalid:${attacker.port}/collect` }).end();
    });
    pinToLoopback();

    await safeHttpRequest({
      url: `http://origin.invalid:${origin.port}/hook`,
      headers: { Authorization: 'Bearer receiver-token', 'X-Custom': 'kept' },
    });

    expect(origin.requests[0].headers.authorization).toBe('Bearer receiver-token');
    expect(attacker.requests[0].headers.authorization).toBeUndefined();
    expect(attacker.requests[0].headers['x-custom']).toBe('kept');
  });

  it('keeps credential headers on a same origin redirect', async () => {
    const origin = await serve((req, res) => {
      if (req.url === '/hook') {
        res.writeHead(302, { location: '/hook-moved' }).end();
        return;
      }

      res.writeHead(200).end('ok');
    });
    pinToLoopback();

    await safeHttpRequest({
      url: `http://origin.invalid:${origin.port}/hook`,
      headers: { Authorization: 'Bearer receiver-token' },
    });

    expect(origin.requests[1].url).toBe('/hook-moved');
    expect(origin.requests[1].headers.authorization).toBe('Bearer receiver-token');
  });

  it('turns a 303 into a bodyless GET', async () => {
    const origin = await serve((req, res) => {
      if (req.url === '/hook') {
        res.writeHead(303, { location: '/result' }).end();
        return;
      }

      res.writeHead(200).end('ok');
    });
    pinToLoopback();

    await safeHttpRequest({
      url: `http://origin.invalid:${origin.port}/hook`,
      method: 'POST',
      data: { hello: 'world' },
    });

    expect(origin.requests[1].method).toBe('GET');
    expect(origin.requests[1].body).toBe('');
    expect(origin.requests[1].headers['content-type']).toBeUndefined();
  });

  it('rejects a response body larger than the cap instead of buffering it', async () => {
    const origin = await serve((_req, res) => {
      res.writeHead(200, { 'content-type': 'application/octet-stream' });

      // 8 MiB, above the 5 MiB cap
      for (let i = 0; i < 8; i++) {
        res.write(Buffer.alloc(1024 * 1024, 'a'));
      }

      res.end();
    });
    pinToLoopback();

    await expect(
      safeHttpRequest({
        url: `http://origin.invalid:${origin.port}/big`,
        maxContentLength: Number.MAX_SAFE_INTEGER,
      } as any),
    ).rejects.toThrow(/maxContentLength/);
  });

  it('applies one deadline across the whole redirect chain', async () => {
    const origin = await serve((_req, res) => {
      setTimeout(() => {
        res.writeHead(302, { location: '/next' }).end();
      }, 200);
    });
    pinToLoopback();

    const startedAt = Date.now();

    await expect(
      safeHttpRequest({ url: `http://origin.invalid:${origin.port}/slow`, timeout: 500 }),
    ).rejects.toThrow();

    // a per hop timeout would allow 6 x 500ms here
    expect(Date.now() - startedAt).toBeLessThan(1500);
    expect(origin.requests.length).toBeLessThan(6);
  });
});
