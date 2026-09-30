import { normalizeMonitorUrl } from './normalize-monitor-url';

describe('normalizeMonitorUrl', () => {
  it('ignores the protocol, host case, a leading www. and a trailing slash', () => {
    expect(normalizeMonitorUrl('http://www.Example.COM/')).toBe('example.com');
    expect(normalizeMonitorUrl('https://example.com')).toBe('example.com');
  });

  it('keeps the path and its case', () => {
    expect(normalizeMonitorUrl('https://www.example.com/Pricing/')).toBe('example.com/Pricing');
  });

  it('keeps the query string', () => {
    expect(normalizeMonitorUrl('https://example.com/?plan=pro')).toBe('example.com?plan=pro');
    expect(normalizeMonitorUrl('https://example.com/status?plan=pro')).toBe(
      'example.com/status?plan=pro',
    );
  });

  it('keeps subdomains other than www and non default ports', () => {
    expect(normalizeMonitorUrl('https://www2.example.com')).toBe('www2.example.com');
    expect(normalizeMonitorUrl('https://api.example.com:8443/health')).toBe(
      'api.example.com:8443/health',
    );
  });
});
