import { forwardOnboardingUpdate } from '$lib/domains/onboarding/application/forward-onboarding-update.server';
import { parseAcceptConsentsDto } from '$lib/domains/onboarding/domain/onboarding-dtos';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = ({ request, cookies }) =>
  forwardOnboardingUpdate({
    request,
    cookies,
    path: 'consents',
    parse: parseAcceptConsentsDto,
  });
