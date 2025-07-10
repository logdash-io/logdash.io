import { Injectable } from '@nestjs/common';
import { CustomDomainReadService } from '../read/custom-domain-read.service';
import { RedisService } from '../../shared/redis/redis.service';

@Injectable()
export class CustomDomainVerificationService {
  private readonly CACHE_TTL_SECONDS = 10;
  private readonly CACHE_KEY_PREFIX = 'custom_domain_verification:';

  constructor(
    private readonly customDomainReadService: CustomDomainReadService,
    private readonly redisService: RedisService,
  ) {}

  public async isVerified(domain: string): Promise<boolean> {
    const cacheKey = `${this.CACHE_KEY_PREFIX}${domain}`;

    const cachedResult = await this.redisService.get(cacheKey);
    if (cachedResult !== null) {
      return cachedResult === 'true';
    }

    const isVerified = await this.customDomainReadService.isVerified(domain);

    await this.redisService.set(cacheKey, isVerified.toString(), this.CACHE_TTL_SECONDS);

    return isVerified;
  }
}
