import type { OnboardingAnswersDto } from '$lib/domains/onboarding/domain/onboarding-dtos';
import { OnboardingService } from '$lib/domains/onboarding/infrastructure/onboarding.service';
import { posthog } from 'posthog-js';

export const acceptConsents = async (marketing: boolean): Promise<void> => {
  await OnboardingService.acceptConsents({
    termsAccepted: true,
    marketingConsent: marketing,
  });

  posthog.capture('consents_accepted', { marketing });
};

export const saveOnboardingAnswers = async (
  answers: OnboardingAnswersDto,
): Promise<void> => {
  await OnboardingService.saveAnswers(answers);

  posthog.capture('onboarding_completed', answers);
};
