import { Injectable } from '@nestjs/common';
import { RedisService } from '../../shared/redis/redis.service';
import {
  CLI_AUTH_POLL_INTERVAL_SECONDS,
  CLI_AUTH_TTL_SECONDS,
  CliAuthPendingRecord,
} from './cli-auth.types';

const RECORD_PREFIX = 'cli-auth:device:'; // value = JSON record, keyed by hmac(deviceCode)
const USER_CODE_INDEX_PREFIX = 'cli-auth:user-code:'; // value = hmac(deviceCode), keyed by userCode
const POLL_THROTTLE_PREFIX = 'cli-auth:poll-throttle:'; // existence = polled within interval

/**
 * Redis-backed store for the CLI device-authorization flow. Holds the pending
 * record under hmac(deviceCode) and a thin userCode -> hmac(deviceCode) index so
 * approval (which only knows the userCode) can resolve the record. Both keys carry
 * the same 600s TTL. Nothing here is ever persisted to Mongo.
 */
@Injectable()
export class CliAuthStoreService {
  constructor(private readonly redis: RedisService) {}

  private recordKey(deviceCodeHash: string): string {
    return `${RECORD_PREFIX}${deviceCodeHash}`;
  }

  private userCodeKey(userCode: string): string {
    return `${USER_CODE_INDEX_PREFIX}${userCode}`;
  }

  private throttleKey(deviceCodeHash: string): string {
    return `${POLL_THROTTLE_PREFIX}${deviceCodeHash}`;
  }

  public async create(record: CliAuthPendingRecord): Promise<void> {
    await this.redis.set(
      this.recordKey(record.deviceCodeHash),
      JSON.stringify(record),
      CLI_AUTH_TTL_SECONDS,
    );
    await this.redis.set(
      this.userCodeKey(record.userCode),
      record.deviceCodeHash,
      CLI_AUTH_TTL_SECONDS,
    );
  }

  public async getByDeviceCodeHash(
    deviceCodeHash: string,
  ): Promise<CliAuthPendingRecord | null> {
    const raw = await this.redis.get(this.recordKey(deviceCodeHash));

    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as CliAuthPendingRecord;
  }

  public async getByUserCode(userCode: string): Promise<CliAuthPendingRecord | null> {
    const deviceCodeHash = await this.redis.get(this.userCodeKey(userCode));

    if (!deviceCodeHash) {
      return null;
    }

    return this.getByDeviceCodeHash(deviceCodeHash);
  }

  /**
   * Overwrite an existing record, preserving the remaining TTL. We compute the
   * remaining TTL from createdAt so approval doesn't extend the 10-min window.
   */
  public async update(record: CliAuthPendingRecord): Promise<void> {
    const remaining = this.remainingTtlSeconds(record.createdAt);

    if (remaining <= 0) {
      return;
    }

    await this.redis.set(
      this.recordKey(record.deviceCodeHash),
      JSON.stringify(record),
      remaining,
    );
    await this.redis.set(this.userCodeKey(record.userCode), record.deviceCodeHash, remaining);
  }

  /**
   * One-time delivery: destroy both indexes so the approved value can never be
   * returned a second time.
   */
  public async delete(record: CliAuthPendingRecord): Promise<void> {
    await this.redis.del(this.recordKey(record.deviceCodeHash));
    await this.redis.del(this.userCodeKey(record.userCode));
  }

  /**
   * Poll rate-limit: returns true if this deviceCode was polled within the
   * interval (caller should answer slow_down). Sets a short throttle marker.
   */
  public async shouldSlowDown(deviceCodeHash: string): Promise<boolean> {
    const key = this.throttleKey(deviceCodeHash);
    const exists = await this.redis.exists(key);

    if (exists) {
      return true;
    }

    await this.redis.set(key, '1', CLI_AUTH_POLL_INTERVAL_SECONDS);

    return false;
  }

  private remainingTtlSeconds(createdAt: number): number {
    const elapsed = Math.floor((Date.now() - createdAt) / 1000);

    return CLI_AUTH_TTL_SECONDS - elapsed;
  }
}
