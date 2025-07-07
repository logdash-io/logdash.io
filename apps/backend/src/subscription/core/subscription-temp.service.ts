import { Injectable } from '@nestjs/common';
import { UserReadService } from '../../user/read/user-read.service';
import { UserTier } from '../../user/core/enum/user-tier.enum';
import { UserTierService } from '../../user/tier/user-tier.service';

@Injectable()
export class SubscriptionTempService {
  constructor(
    private readonly userReadService: UserReadService,
    private readonly userTierService: UserTierService,
  ) {}

  public async runSync(): Promise<void> {
    const users = await this.userReadService.readAll();

    for (const user of users) {
      if (user.tier === UserTier.Free) {
        await this.userTierService.updateUserTier(user.id, UserTier.EarlyUser);
      }
    }
  }
}
