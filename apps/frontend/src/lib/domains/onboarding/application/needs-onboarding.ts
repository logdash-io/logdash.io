import type { OnboardingStep } from '$lib/domains/onboarding/domain/onboarding-questions';
import type { User } from '$lib/domains/shared/user/domain/user';

export function needsOnboarding(user: User | null): boolean {
  return (
    user?.accountClaimStatus === 'claimed' &&
    pendingOnboardingSteps(user).length > 0
  );
}

export function pendingOnboardingSteps(user: User): OnboardingStep[] {
  return [
    ...(user.termsAcceptedAt === null ? (['consents'] as const) : []),
    ...(user.onboardingCompletedAt === null ? (['questions'] as const) : []),
  ];
}

export function onboardingUrl(nextUrl: string): string {
  return `/app/onboarding?next_url=${encodeURIComponent(nextUrl)}`;
}
