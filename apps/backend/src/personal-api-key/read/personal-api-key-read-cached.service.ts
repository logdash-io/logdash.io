import { Injectable } from '@nestjs/common';
import { RedisService } from '../../shared/redis/redis.service';
import { AccessRestriction } from '../core/types/access-restriction.type';
import { ScopeEntry } from '../core/types/scope-entry.type';
import { PersonalApiKeyReadService } from './personal-api-key-read.service';

const CACHE_TTL_SECONDS = 45;
const NEGATIVE_TTL_SECONDS = 10;
const NON_EXISTENT = 'non-existent';

export interface CachedPersonalApiKey {
  id: string;
  userId: string;
  hash: string;
  scopes: ScopeEntry[];
  access: AccessRestriction;
  expiresAt?: string;
  revokedAt?: string;
}

@Injectable()
export class PersonalApiKeyReadCachedService {
  constructor(
    private readonly personalApiKeyReadService: PersonalApiKeyReadService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Returns the cached lean key (keyed on PREFIX, never the secret value) or null
   * on miss. Unlike other cached read services, this NEVER throws on a negative
   * cache — a revoked/typo'd key must not lock out a real one for the whole TTL.
   */
  public async readActiveByPrefix(prefix: string): Promise<CachedPersonalApiKey | null> {
    const cacheKey = `personal-api-key:${prefix}`;

    const cached = await this.redisService.get(cacheKey);

    if (cached === NON_EXISTENT) {
      return null;
    }

    if (cached !== null) {
      try {
        return JSON.parse(cached) as CachedPersonalApiKey;
      } catch {
        // fall through to a fresh Mongo read on a corrupt cache entry
      }
    }

    const key = await this.personalApiKeyReadService.readActiveByPrefix(prefix);

    if (!key) {
      await this.redisService.set(cacheKey, NON_EXISTENT, NEGATIVE_TTL_SECONDS);
      return null;
    }

    const value: CachedPersonalApiKey = {
      id: key.id,
      userId: key.userId,
      hash: key.hash,
      scopes: key.scopes,
      access: key.access,
      expiresAt: key.expiresAt ? key.expiresAt.toISOString() : undefined,
      revokedAt: key.revokedAt ? key.revokedAt.toISOString() : undefined,
    };

    await this.redisService.set(cacheKey, JSON.stringify(value), CACHE_TTL_SECONDS);

    return value;
  }
}
