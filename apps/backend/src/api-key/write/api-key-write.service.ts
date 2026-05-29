import { randomBytes } from 'node:crypto';
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
    return 'ldi_' + this.base62(randomBytes(24));
  }

  private base62(bytes: Buffer): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    let value = 0n;
    for (const byte of bytes) {
      value = (value << 8n) | BigInt(byte);
    }

    if (value === 0n) {
      return characters[0];
    }

    const base = BigInt(characters.length);
    let result = '';
    while (value > 0n) {
      result = characters[Number(value % base)] + result;
      value = value / base;
    }

    return result;
  }

  public async deleteByProjectId(projectId: string): Promise<void> {
    await this.apiKeyModel.deleteMany({ projectId });
  }
}
