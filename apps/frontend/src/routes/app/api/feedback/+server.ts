import { bffLogger } from '$lib/domains/shared/bff-logger.server';
import { parseFeedback } from '$lib/domains/shared/feedback/domain/feedback';
import { get_access_token } from '$lib/domains/shared/utils/cookies.utils';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, cookies }) => {
  if (!get_access_token(cookies)) {
    return new Response(null, { status: 401 });
  }

  const feedback = parseFeedback(await request.json().catch(() => null));

  if (!feedback) {
    return new Response(null, { status: 400 });
  }

  bffLogger().info(`feedback ${feedback.rating}/5: ${feedback.message}`);

  return new Response(null, { status: 204 });
};
