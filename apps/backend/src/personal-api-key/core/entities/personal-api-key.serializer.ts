import { PersonalApiKeyEntity } from './personal-api-key.entity';
import {
  PersonalApiKeyNormalized,
  PersonalApiKeySerialized,
} from './personal-api-key.interface';

export class PersonalApiKeySerializer {
  public static normalize(entity: PersonalApiKeyEntity): PersonalApiKeyNormalized {
    return {
      id: entity._id.toString(),
      userId: entity.userId,
      label: entity.label,
      prefix: entity.prefix,
      hash: entity.hash,
      scopes: entity.scopes,
      access: entity.access,
      expiresAt: entity.expiresAt,
      lastUsedAt: entity.lastUsedAt,
      revokedAt: entity.revokedAt,
      createdAt: entity.createdAt,
    };
  }

  public static serialize(normalized: PersonalApiKeyNormalized): PersonalApiKeySerialized {
    return {
      id: normalized.id,
      userId: normalized.userId,
      label: normalized.label,
      prefix: normalized.prefix,
      scopes: normalized.scopes,
      access: normalized.access,
      expiresAt: normalized.expiresAt,
      lastUsedAt: normalized.lastUsedAt,
      createdAt: normalized.createdAt,
    };
  }
}
