import type { Feedback } from '$lib/domains/shared/feedback/domain/feedback';
import { envConfig } from '$lib/domains/shared/utils/env-config';

export const postFeedback = async (dto: {
  token: string;
  feedback: Feedback;
}): Promise<Response> =>
  fetch(`${envConfig.apiBaseUrl}/feedback`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${dto.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(dto.feedback),
  });
