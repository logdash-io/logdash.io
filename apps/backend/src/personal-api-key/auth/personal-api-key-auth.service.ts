import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PersonalApiKeyEntity } from '../core/entities/personal-api-key.entity';
import { verifyPersonalApiKeyValue } from '../core/personal-api-key.hashing';
import { extractPrefix, PERSONAL_API_KEY_PREFIX } from '../core/personal-api-key.token';
import { AuthedKey } from '../core/types/authed-key.type';
import { PersonalApiKeyReadCachedService } from '../read/personal-api-key-read-cached.service';

const LAST_USED_DEBOUNCE_MS = 60 * 1000; // ≤1 write/min/key

@Injectable()
export class PersonalApiKeyAuthService {
  // in-process debounce: keyId -> last lastUsedAt write epoch ms
  private readonly lastUsedWrites = new Map<string, number>();

  constructor(
    private readonly personalApiKeyReadCachedService: PersonalApiKeyReadCachedService,
    @InjectModel(PersonalApiKeyEntity.name)
    private readonly personalApiKeyModel: Model<PersonalApiKeyEntity>,
  ) {}

  public async verify(presentedValue: string): Promise<AuthedKey | null> {
    if (!presentedValue || !presentedValue.startsWith(PERSONAL_API_KEY_PREFIX)) {
      return null;
    }

    const prefix = extractPrefix(presentedValue);

    const stored = await this.personalApiKeyReadCachedService.readActiveByPrefix(prefix);

    if (!stored) {
      return null;
    }

    if (stored.revokedAt) {
      return null;
    }

    if (!verifyPersonalApiKeyValue(presentedValue, stored.hash)) {
      return null;
    }

    if (stored.expiresAt && new Date(stored.expiresAt).getTime() < Date.now()) {
      return null;
    }

    this.touchLastUsed(stored.id);

    return {
      userId: stored.userId,
      scopes: stored.scopes,
      access: stored.access,
    };
  }

  private touchLastUsed(keyId: string): void {
    const now = Date.now();
    const lastWrite = this.lastUsedWrites.get(keyId) ?? 0;

    if (now - lastWrite < LAST_USED_DEBOUNCE_MS) {
      return;
    }

    this.lastUsedWrites.set(keyId, now);

    // fire-and-forget — never block the request on it
    void this.personalApiKeyModel
      .updateOne({ _id: keyId }, { lastUsedAt: new Date() })
      .exec()
      .catch(() => undefined);
  }
}
