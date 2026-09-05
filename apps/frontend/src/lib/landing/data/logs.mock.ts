export type FakeLogLevel = 'info' | 'warning' | 'error' | 'http' | 'debug';

export type FakeLogTemplate = {
  level: FakeLogLevel;
  message: string;
};

export const FAKE_LOG_POOL: FakeLogTemplate[] = [
  { level: 'info', message: 'Cache invalidation completed' },
  { level: 'info', message: 'Payment processed successfully' },
  { level: 'error', message: 'Payment processing failed' },
  { level: 'info', message: 'User successfully authenticated' },
  { level: 'error', message: 'Authentication failed - Invalid credentials' },
  { level: 'warning', message: 'High API latency detected' },
  { level: 'warning', message: 'Database connection pool nearing capacity' },
  { level: 'http', message: 'POST /api/checkout 201 in 342 ms' },
  { level: 'info', message: 'Webhook delivered to stripe.com' },
  { level: 'debug', message: 'Cron billing-reconcile finished in 1.2 s' },
  { level: 'http', message: 'GET /api/users/me 200 in 48 ms' },
  { level: 'warning', message: 'Retrying email delivery (attempt 2/5)' },
  { level: 'info', message: 'New workspace created: acme-inc' },
  { level: 'error', message: 'Redis command timed out after 5000 ms' },
  { level: 'http', message: 'GET /health 200 in 3 ms' },
  { level: 'info', message: 'Deployment v2.14.3 is live' },
  { level: 'debug', message: 'Session cache warmed for 1,204 users' },
  { level: 'http', message: 'PATCH /api/projects/42 200 in 91 ms' },
];
