import type { DocsPath } from '$lib/landing/guides/documentation.data';
import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const MOVED_TO_DOCS: Record<string, DocsPath> = {
  '': '/docs',
  logging: '/docs/logging',
  metrics: '/docs/metrics',
  monitoring: '/docs/monitoring',
  'sdk-migration': '/docs/sdks/node',
};

export const GET: RequestHandler = ({ params }) => {
  const target = MOVED_TO_DOCS[params.path];

  if (!target) {
    error(404, 'Not found');
  }

  redirect(301, target);
};
