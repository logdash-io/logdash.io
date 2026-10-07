import type { OnboardingAnswersDto } from '$lib/domains/onboarding/domain/onboarding-dtos';
import { OnboardingService } from '$lib/domains/onboarding/infrastructure/onboarding.service';

export const acceptConsents = async (marketing: boolean): Promise<void> => {
  await OnboardingService.acceptConsents({
    termsAccepted: true,
    marketingConsent: marketing,
  });

  window.logdash?.track('signup_completed');
};

export const saveOnboardingAnswers = async (
  answers: OnboardingAnswersDto,
): Promise<void> => {
  await OnboardingService.saveAnswers(answers);

  window.logdash?.track('onboarding_completed');
};
