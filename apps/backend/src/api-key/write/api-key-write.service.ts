import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ApiKeyEntity } from '../core/entities/api-key.entity';
import { Model } from 'mongoose';
import { ApiKeyNormalized } from '../core/entities/api-key.interface';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { ApiKeySerializer } from '../core/entities/api-key.serializer';

@Injectable()
export class ApiKeyWriteService {
  constructor(@InjectModel(ApiKeyEntity.name) private apiKeyModel: Model<ApiKeyEntity>) {}

  public async createApiKey(dto: CreateApiKeyDto): Promise<ApiKeyNormalized> {
    const value = this.generateApiKeyValue();

    const apiKey = await this.apiKeyModel.create({
      projectId: dto.projectId,
      value,
    });

    return ApiKeySerializer.normalize(apiKey);
  }

  private generateApiKeyValue(): string {
    const timestamp = Date.now().toString(36);

    const resultArray = new Array(32).fill('');

    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;

    for (let i = 0; i < timestamp.length; i++) {
      const position = (i * 7) % 32;
      resultArray[position] = timestamp[i];
    }

    for (let i = 0; i < 32; i++) {
      if (!resultArray[i]) {
        resultArray[i] = characters.charAt(Math.floor(Math.random() * charactersLength));
      }
    }

    return resultArray.join('');
  }

  public async deleteByProjectId(projectId: string): Promise<void> {
    await this.apiKeyModel.deleteMany({ projectId });
  }
}
