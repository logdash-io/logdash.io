import { parseFeedback } from '$lib/domains/shared/feedback/domain/feedback';
import { postFeedback } from '$lib/domains/shared/feedback/infrastructure/feedback-api.server';
import { get_access_token } from '$lib/domains/shared/utils/cookies.utils';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, cookies }) => {
  const token = get_access_token(cookies);

  if (!token) {
    return new Response(null, { status: 401 });
  }

  const feedback = parseFeedback(await request.json().catch(() => null));

  if (!feedback) {
    return new Response(null, { status: 400 });
  }

  const response = await postFeedback({ token, feedback }).catch(() => null);

  return new Response(null, { status: response?.status ?? 503 });
};
