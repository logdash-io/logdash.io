import type {
  AcceptConsentsDto,
  OnboardingAnswersDto,
} from '$lib/domains/onboarding/domain/onboarding-dtos';
import type { User } from '$lib/domains/shared/user/domain/user';

export class OnboardingService {
  public static async acceptConsents(dto: AcceptConsentsDto): Promise<User> {
    return postJson('/app/api/onboarding/consents', dto);
  }

  public static async saveAnswers(dto: OnboardingAnswersDto): Promise<User> {
    return postJson('/app/api/onboarding/answers', dto);
  }
}

const postJson = async (url: string, body: unknown): Promise<User> => {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`${url} failed with ${response.status}`);
  }

  return (await response.json()) as User;
};
