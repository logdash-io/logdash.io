import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PersonalApiKeyEntity } from '../core/entities/personal-api-key.entity';
import { PersonalApiKeyNormalized } from '../core/entities/personal-api-key.interface';
import { PersonalApiKeySerializer } from '../core/entities/personal-api-key.serializer';

@Injectable()
export class PersonalApiKeyReadService {
  constructor(
    @InjectModel(PersonalApiKeyEntity.name)
    private personalApiKeyModel: Model<PersonalApiKeyEntity>,
  ) {}

  public async readById(id: string): Promise<PersonalApiKeyNormalized | null> {
    const key = await this.personalApiKeyModel
      .findById(id)
      .lean<PersonalApiKeyEntity>()
      .exec();

    if (!key) {
      return null;
    }

    return PersonalApiKeySerializer.normalize(key);
  }

  public async readActiveByPrefix(prefix: string): Promise<PersonalApiKeyNormalized | null> {
    const key = await this.personalApiKeyModel
      .findOne({ prefix, revokedAt: null })
      .lean<PersonalApiKeyEntity>()
      .exec();

    if (!key) {
      return null;
    }

    return PersonalApiKeySerializer.normalize(key);
  }

  public async readByUserId(userId: string): Promise<PersonalApiKeyNormalized[]> {
    const keys = await this.personalApiKeyModel
      .find({ userId, revokedAt: null })
      .sort({ createdAt: -1 })
      .lean<PersonalApiKeyEntity[]>()
      .exec();

    return keys.map((key) => PersonalApiKeySerializer.normalize(key));
  }
}
