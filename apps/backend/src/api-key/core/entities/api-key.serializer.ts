import { ApiKeyEntity } from './api-key.entity';
import { ApiKeyNormalized, ApiKeySerialized } from './api-key.interface';

export class ApiKeySerializer {
  public static normalize(entity: ApiKeyEntity): ApiKeyNormalized {
    return {
      id: entity._id.toString(),
      value: entity.value,
      projectId: entity.projectId,
    };
  }

  public static serialize(normalized: ApiKeyNormalized): ApiKeySerialized {
    return {
      id: normalized.id,
      value: normalized.value,
      projectId: normalized.projectId,
    };
  }
}
