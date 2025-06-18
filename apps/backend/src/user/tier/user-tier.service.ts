import { Injectable } from '@nestjs/common';
import { UserNormalized } from '../core/entities/user.interface';
import { UserEventEmitter } from '../events/user-event.emitter';
import { UserWriteService } from '../write/user-write.service';
import { UserTier } from '../core/enum/user-tier.enum';

@Injectable()
export class UserTierService {
  constructor(
    private readonly userWriteService: UserWriteService,
    private readonly userEventEmitter: UserEventEmitter,
  ) {}

  public async updateUserTier(userId: string, newTier: UserTier): Promise<UserNormalized> {
    const user = await this.userWriteService.update({
      id: userId,
      tier: newTier,
    });

    this.userEventEmitter.emitUserTierChanged({
      userId: userId,
      newTier: newTier,
    });

    return user;
  }
}
