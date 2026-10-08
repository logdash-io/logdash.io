import { Resolver } from 'node:dns/promises';
import { UnsafeUrlError, assertPublicUrl } from '../../../src/shared/ssrf/safe-url';

function dnsError(code: string): Error {
  return Object.assign(new Error(`query ${code}`), { code });
}

describe('assertPublicUrl', () => {
  const resolve4 = jest.spyOn(Resolver.prototype, 'resolve4');
  const resolve6 = jest.spyOn(Resolver.prototype, 'resolve6');

  beforeEach(() => {
    resolve4.mockReset();
    resolve6.mockReset();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('returns the addresses of both families, ipv4 first', async () => {
    // given
    resolve4.mockResolvedValue(['93.184.215.14']);
    resolve6.mockResolvedValue(['2606:2800:21f:cb07:6820:80da:af6b:8b2c']);

    // when
    const { addresses } = await assertPublicUrl('https://example.com/health');

    // then
    expect(addresses).toEqual([
      { address: '93.184.215.14', family: 4 },
      { address: '2606:2800:21f:cb07:6820:80da:af6b:8b2c', family: 6 },
    ]);
  });

  it('accepts a host that only has ipv6 addresses', async () => {
    // given
    resolve4.mockRejectedValue(dnsError('ENODATA'));
    resolve6.mockResolvedValue(['2606:2800:21f:cb07:6820:80da:af6b:8b2c']);

    // when
    const { addresses } = await assertPublicUrl('https://example.com');

    // then
    expect(addresses).toEqual([{ address: '2606:2800:21f:cb07:6820:80da:af6b:8b2c', family: 6 }]);
  });

  it('blocks a host when either family resolves to a private address', async () => {
    // given
    resolve4.mockResolvedValue(['93.184.215.14']);
    resolve6.mockResolvedValue(['fd00::1']);

    // when
    const result = assertPublicUrl('https://example.com');

    // then
    await expect(result).rejects.toThrow(UnsafeUrlError);
  });

  it('passes the dns error on when neither family resolves', async () => {
    // given
    resolve4.mockRejectedValue(dnsError('ENOTFOUND'));
    resolve6.mockRejectedValue(dnsError('ENOTFOUND'));

    // when
    const result = assertPublicUrl('https://missing.example.com');

    // then
    await expect(result).rejects.toMatchObject({ code: 'ENOTFOUND' });
  });
});
