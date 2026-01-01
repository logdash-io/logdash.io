import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ApiKeyEntity } from '../core/entities/api-key.entity';
import { ApiKeyNormalized } from '../core/entities/api-key.interface';
import { ApiKeySerializer } from '../core/entities/api-key.serializer';

@Injectable()
export class ApiKeyReadService {
  constructor(@InjectModel(ApiKeyEntity.name) private apiKeyModel: Model<ApiKeyEntity>) {}

  public async readApiKeyByValue(value: string): Promise<ApiKeyNormalized | null> {
    const apiKey = await this.apiKeyModel.findOne({ value }).lean<ApiKeyEntity>().exec();

    if (!apiKey) {
      return null;
    }

    return ApiKeySerializer.normalize(apiKey);
  }

  public async readApiKeysByProjectId(projectId: string): Promise<ApiKeyNormalized[]> {
    const apiKeys = await this.apiKeyModel.find({ projectId }).lean<ApiKeyEntity[]>().exec();

    return apiKeys.map((apiKey) => ApiKeySerializer.normalize(apiKey));
  }
}
