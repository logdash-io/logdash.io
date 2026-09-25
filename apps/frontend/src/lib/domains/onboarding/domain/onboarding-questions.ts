export type OnboardingStep = 'consents' | 'questions';

export const ROLE_OPTIONS = [
  { value: 'solo-founder', label: 'Solo founder or indie hacker' },
  { value: 'startup-developer', label: 'Developer at a startup' },
  { value: 'company-developer', label: 'Developer at a larger company' },
  { value: 'agency-or-freelancer', label: 'Agency or freelancer' },
  { value: 'student-or-hobbyist', label: 'Student or hobbyist' },
  { value: 'something-else', label: 'Something else' },
] as const;

export const SOURCE_OPTIONS = [
  { value: 'search-engine', label: 'Search engine' },
  { value: 'ai-assistant', label: 'AI assistant' },
  { value: 'x-twitter', label: 'X (Twitter)' },
  { value: 'reddit', label: 'Reddit' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'hacker-news', label: 'Hacker News' },
  { value: 'product-hunt', label: 'Product Hunt' },
  { value: 'friend-or-colleague', label: 'A friend or colleague' },
  { value: 'something-else', label: 'Something else' },
] as const;

export type OnboardingRole = (typeof ROLE_OPTIONS)[number]['value'];
export type OnboardingSource = (typeof SOURCE_OPTIONS)[number]['value'];

export const ONBOARDING_QUESTIONS = [
  { key: 'role', label: 'What best describes you?', options: ROLE_OPTIONS },
  {
    key: 'source',
    label: 'How did you hear about Logdash?',
    options: SOURCE_OPTIONS,
  },
] as const;
