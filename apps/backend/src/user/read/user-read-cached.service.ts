import { Injectable } from '@nestjs/common';
import { UserReadService } from './user-read.service';
import { UserTier } from '../core/enum/user-tier.enum';
import { RedisService } from '../../shared/redis/redis.service';
import { Logger } from '@logdash/js-sdk';

@Injectable()
export class UserReadCachedService {
  constructor(
    private readonly userReadService: UserReadService,
    private readonly logger: Logger,
    private readonly redisService: RedisService,
  ) {}

  public async readTier(userId: string): Promise<UserTier> {
    const cacheKey = `user:${userId}:tier`;
    const cacheTtlSeconds = 5;

    const tier = await this.redisService.get(cacheKey);

    if (tier === 'null') {
      throw Error(
        'User not found. You have to wait 5 seconds before trying again',
      );
    }

    if (tier !== null) {
      return tier as UserTier;
    }

    const user = await this.userReadService.readById(userId);

    if (!user) {
      await this.redisService.set(cacheKey, 'null', cacheTtlSeconds);
      this.logger.error(`User not found`, {
        userId,
      });
      throw Error('User not found');
    }

    await this.redisService.set(cacheKey, user.tier, cacheTtlSeconds);

    return user.tier;
  }
}
