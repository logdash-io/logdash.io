import { httpClient } from '$lib/domains/shared/http/http-client.js';
import type { UserTier } from '$lib/domains/shared/types.js';

export class UsersService {
  static async changePaidPlan(tier: UserTier): Promise<void> {
    return httpClient.post('/payments/stripe/change_paid_plan', { tier });
  }
}
