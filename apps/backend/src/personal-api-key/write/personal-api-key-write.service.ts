import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PersonalApiKeyEntity } from '../core/entities/personal-api-key.entity';
import { PersonalApiKeyNormalized } from '../core/entities/personal-api-key.interface';
import { PersonalApiKeySerializer } from '../core/entities/personal-api-key.serializer';
import { hashPersonalApiKeyValue } from '../core/personal-api-key.hashing';
import { generatePersonalApiKeyValue } from '../core/personal-api-key.token';
import { CreatePersonalApiKeyDto } from './dto/create-personal-api-key.dto';

export interface CreatedPersonalApiKey {
  key: PersonalApiKeyNormalized;
  value: string; // plaintext, returned ONCE — never persisted, never logged
}

@Injectable()
export class PersonalApiKeyWriteService {
  constructor(
    @InjectModel(PersonalApiKeyEntity.name)
    private personalApiKeyModel: Model<PersonalApiKeyEntity>,
  ) {}

  public async create(dto: CreatePersonalApiKeyDto): Promise<CreatedPersonalApiKey> {
    const { value, prefix } = generatePersonalApiKeyValue();
    const hash = hashPersonalApiKeyValue(value);

    const key = await this.personalApiKeyModel.create({
      userId: dto.userId,
      label: dto.label,
      prefix,
      hash,
      scopes: dto.scopes,
      access: dto.access,
      expiresAt: dto.expiresAt,
    });

    return {
      key: PersonalApiKeySerializer.normalize(key),
      value,
    };
  }

  public async revoke(dto: { id: string; userId: string }): Promise<void> {
    const key = await this.personalApiKeyModel.findById(dto.id).exec();

    if (!key || key.revokedAt) {
      throw new NotFoundException('Personal API key not found');
    }

    if (key.userId !== dto.userId) {
      throw new ForbiddenException('You do not own this personal API key');
    }

    await this.personalApiKeyModel
      .updateOne({ _id: key._id }, { revokedAt: new Date() })
      .exec();
  }
}
