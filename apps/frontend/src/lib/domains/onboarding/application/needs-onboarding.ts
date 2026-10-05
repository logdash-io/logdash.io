import type { User } from '$lib/domains/shared/user/domain/user';

export function needsOnboarding(user: User | null): boolean {
  return (
    user?.accountClaimStatus === 'claimed' && user.termsAcceptedAt === null
  );
}

export function onboardingUrl(nextUrl: string): string {
  return `/app/onboarding?next_url=${encodeURIComponent(nextUrl)}`;
}
