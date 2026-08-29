import { redactSecrets } from '../../../src/shared/logdash/redact-secrets';

describe('redactSecrets', () => {
  it('redacts credential shaped keys, whatever their casing or separator', () => {
    expect(
      redactSecrets({
        accessToken: 'jwt',
        refresh_token: 'jwt',
        'API-Key': 'k',
        clientSecret: 's',
        password: 'p',
        Authorization: 'Bearer x',
        cookie: 'session=1',
      }),
    ).toEqual({
      accessToken: '[redacted]',
      refresh_token: '[redacted]',
      'API-Key': '[redacted]',
      clientSecret: '[redacted]',
      password: '[redacted]',
      Authorization: '[redacted]',
      cookie: '[redacted]',
    });
  });

  it('leaves non credential keys alone, including ones that merely mention a token', () => {
    expect(redactSecrets({ userId: 'u1', tokenPayload: { id: 'u1' }, email: 'a@b.c' })).toEqual({
      userId: 'u1',
      tokenPayload: { id: 'u1' },
      email: 'a@b.c',
    });
  });

  it('walks nested objects and arrays', () => {
    expect(redactSecrets({ channels: [{ name: 'hook', headers: { apiKey: 'k' } }] })).toEqual({
      channels: [{ name: 'hook', headers: { apiKey: '[redacted]' } }],
    });
  });

  it('passes errors through untouched so message and stack survive logging', () => {
    const error = new Error('boom');

    expect(redactSecrets(error)).toBe(error);
    expect(redactSecrets({ error }).error).toBe(error);
  });

  it('passes primitives and dates through untouched', () => {
    const date = new Date(0);

    expect(redactSecrets('Claiming account')).toBe('Claiming account');
    expect(redactSecrets(42)).toBe(42);
    expect(redactSecrets(null)).toBeNull();
    expect(redactSecrets({ createdAt: date }).createdAt).toBe(date);
  });
});
