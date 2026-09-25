import {
  ROLE_OPTIONS,
  SOURCE_OPTIONS,
  type OnboardingRole,
  type OnboardingSource,
} from './onboarding-questions';

export type AcceptConsentsDto = {
  termsAccepted: true;
  marketingConsent: boolean;
};

export type OnboardingAnswersDto = {
  role: OnboardingRole;
  source: OnboardingSource;
};

export const parseAcceptConsentsDto = (
  body: unknown,
): AcceptConsentsDto | null => {
  const { termsAccepted, marketingConsent } = asRecord(body);

  if (termsAccepted !== true || typeof marketingConsent !== 'boolean') {
    return null;
  }

  return { termsAccepted, marketingConsent };
};

export const parseOnboardingAnswersDto = (
  body: unknown,
): OnboardingAnswersDto | null => {
  const { role, source } = asRecord(body);
  const roleOption = ROLE_OPTIONS.find((option) => option.value === role);
  const sourceOption = SOURCE_OPTIONS.find((option) => option.value === source);

  if (!roleOption || !sourceOption) {
    return null;
  }

  return { role: roleOption.value, source: sourceOption.value };
};

const asRecord = (value: unknown): Record<string, unknown> =>
  typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)
    : {};
