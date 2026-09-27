import { forwardOnboardingUpdate } from '$lib/domains/onboarding/application/forward-onboarding-update.server';
import { parseOnboardingAnswersDto } from '$lib/domains/onboarding/domain/onboarding-dtos';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = ({ request, cookies }) =>
  forwardOnboardingUpdate({
    request,
    cookies,
    path: 'onboarding',
    parse: parseOnboardingAnswersDto,
  });
