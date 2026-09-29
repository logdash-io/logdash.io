import { expect, test } from '@playwright/test';
import { displayUrl, urlHost } from '../../../shared/utils/url';
import {
  domainLabel,
  listServices,
  primaryDomain,
  type ServiceItem,
} from './service-groups';

const text = (items: ServiceItem[]): string[] =>
  items.map((item) =>
    [item.label, item.host, item.urlLabel].filter(Boolean).join(' | '),
  );

test('own services sort by host, domains in order of appearance, apex first, URL-less last', () => {
  const { services, dependencies } = listServices([
    { id: '1', name: 'API', url: 'https://api.acme.com/health' },
    { id: '2', name: 'Blog', url: 'https://blog.other.io' },
    { id: '3', name: 'Landing', url: 'https://acme.com/' },
    { id: '4', name: 'Worker' },
    { id: '5', name: 'Dashboard', url: 'https://app.acme.com' },
    { id: '6', name: 'Other apex', url: 'https://other.io/up' },
    { id: '7', name: 'API health', url: 'https://www.acme.com/api/health' },
    { id: '8', name: 'Payments', url: 'https://api.stripe.com/healthcheck' },
  ]);

  expect(text(services)).toEqual([
    'Landing | acme.com | acme.com',
    'API health | acme.com | acme.com/api/health',
    'API | api.acme.com | api.acme.com/health',
    'Dashboard | app.acme.com | app.acme.com',
    'Other apex | other.io | other.io/up',
    'Blog | blog.other.io | blog.other.io',
    'Worker',
  ]);
  expect(text(dependencies)).toEqual([
    'Payments | api.stripe.com | api.stripe.com/healthcheck',
  ]);
  expect(listServices([])).toEqual({ services: [], dependencies: [] });
});

test('dependencies do not count as own hosts', () => {
  const { services, dependencies } = listServices([
    { id: '1', name: 'App', url: 'https://acme.vercel.app' },
    { id: '2', name: 'Stripe', url: 'https://status.stripe.com' },
    { id: '3', name: 'DB', url: 'https://xyz.supabase.co/rest/v1' },
    { id: '4', name: 'Fake', url: 'https://notstripe.com' },
    { id: '5', name: 'Pay', url: 'https://api.stripe.com:8443/v1' },
  ]);

  expect(services.map((item) => item.label)).toEqual(['App', 'Fake']);
  expect(dependencies.map((item) => item.label)).toEqual([
    'Stripe',
    'DB',
    'Pay',
  ]);
});

test('names generated from the URL show the URL and no separate host', () => {
  expect(
    text(
      listServices([
        { id: '1', name: 'acme.com', url: 'https://acme.com' },
        { id: '2', name: 'www.acme.com', url: 'https://www.acme.com/pricing' },
        {
          id: '3',
          name: 'ACME.com/API/Health',
          url: 'https://acme.com/api/health',
        },
        { id: '4', name: 'acme.com', url: 'https://acme.com/api/health' },
        { id: '5', name: 'api.stripe.com', url: 'https://api.stripe.com/up' },
      ]).services,
    ),
  ).toEqual([
    'acme.com',
    'acme.com/pricing',
    'acme.com/api/health',
    'acme.com/api/health',
  ]);
});

test('primaryDomain picks the most frequent own domain, ties to first seen', () => {
  expect(
    primaryDomain([
      'https://beta.io',
      'https://api.acme.co.uk/health',
      'https://acme.co.uk',
      undefined,
    ]),
  ).toBe('acme.co.uk');
  expect(primaryDomain(['https://beta.io', 'https://acme.com'])).toBe(
    'beta.io',
  );
  expect(
    primaryDomain(['https://api.stripe.com', 'https://github.com/acme']),
  ).toBeNull();
  expect(primaryDomain([])).toBeNull();
  expect(domainLabel('Acme', ['https://app.acme.com'])).toBe('acme.com');
  expect(domainLabel('ACME.com', ['https://app.acme.com'])).toBeNull();
});

test('url helpers read hosts and paths without the protocol', () => {
  expect(urlHost('WWW.Acme.com/path')).toBe('acme.com');
  expect(urlHost('http://')).toBeNull();
  expect(urlHost('http://203.0.113.7:3000/health')).toBe('203.0.113.7:3000');
  expect(urlHost('https://acme.com:443/')).toBe('acme.com');
  expect(displayUrl('https://acme.com:8443/health')).toBe(
    'acme.com:8443/health',
  );
  expect(displayUrl('https://www.acme.com/')).toBe('acme.com');
  expect(displayUrl('https://acme.com/api/health/?v=1')).toBe(
    'acme.com/api/health?v=1',
  );
});

test('ports keep hosts apart without splitting the domain', () => {
  expect(
    text(
      listServices([
        { id: '1', name: 'Dev', url: 'http://203.0.113.7:8080' },
        { id: '2', name: 'Prod', url: 'http://203.0.113.7:3000' },
      ]).services,
    ),
  ).toEqual([
    'Dev | 203.0.113.7:8080 | 203.0.113.7:8080',
    'Prod | 203.0.113.7:3000 | 203.0.113.7:3000',
  ]);
  expect(primaryDomain(['https://acme.com:8443/health'])).toBe('acme.com');
  expect(primaryDomain(['http://203.0.113.7:3000'])).toBe('203.0.113.7');
});
