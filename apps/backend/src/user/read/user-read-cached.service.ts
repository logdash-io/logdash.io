import { Injectable } from '@nestjs/common';
import { UserReadService } from './user-read.service';
import { UserTier } from '../core/enum/user-tier.enum';
import { RedisService } from '../../shared/redis/redis.service';

@Injectable()
export class UserReadCachedService {
  constructor(
    private readonly userReadService: UserReadService,
    private readonly redisService: RedisService,
  ) {}

  public async readTier(userId: string): Promise<UserTier> {
    const cacheKey = `user:${userId}:tier`;
    const cacheTtlSeconds = 5;

    const tier = await this.redisService.get(cacheKey);

    if (tier !== null) {
      return tier as UserTier;
    }

    const user = await this.userReadService.readByIdOrThrow(userId);

    await this.redisService.set(cacheKey, user.tier, cacheTtlSeconds);

    return user.tier;
  }
}
