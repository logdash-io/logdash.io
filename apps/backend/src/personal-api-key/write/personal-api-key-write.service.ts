import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Model } from 'mongoose';
import { PersonalApiKeyEntity } from '../core/entities/personal-api-key.entity';
import { PersonalApiKeyNormalized } from '../core/entities/personal-api-key.interface';
import { PersonalApiKeySerializer } from '../core/entities/personal-api-key.serializer';
import { hashPersonalApiKeyValue } from '../core/personal-api-key.hashing';
import { generatePersonalApiKeyValue } from '../core/personal-api-key.token';
import { ACTION_RANK } from '../core/enums/action.enum';
import { MAX_GRANT } from '../core/scope-presets';
import { CreatePersonalApiKeyDto } from './dto/create-personal-api-key.dto';
import { PersonalApiKeyEvents } from '../events/personal-api-key-events.enum';
import { PersonalApiKeyCreatedEvent } from '../events/definitions/personal-api-key-created.event';
import { PersonalApiKeyReadCachedService } from '../read/personal-api-key-read-cached.service';

export interface CreatedPersonalApiKey {
  key: PersonalApiKeyNormalized;
  value: string; // plaintext, returned ONCE — never persisted, never logged
}

@Injectable()
export class PersonalApiKeyWriteService {
  constructor(
    @InjectModel(PersonalApiKeyEntity.name)
    private personalApiKeyModel: Model<PersonalApiKeyEntity>,
    private readonly eventEmitter: EventEmitter2,
    private readonly personalApiKeyReadCachedService: PersonalApiKeyReadCachedService,
  ) {}

  public async create(dto: CreatePersonalApiKeyDto): Promise<CreatedPersonalApiKey> {
    const overGranted = dto.scopes.find(
      ({ resource, action }) => !(ACTION_RANK[action] <= ACTION_RANK[MAX_GRANT[resource]]),
    );

    if (overGranted) {
      throw new BadRequestException(
        `Scope ${overGranted.resource}:${overGranted.action} exceeds the maximum ${overGranted.resource}:${MAX_GRANT[overGranted.resource]}`,
      );
    }

    if (dto.expiresAt && dto.expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException('expiresAt must be in the future');
    }

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

    const event: PersonalApiKeyCreatedEvent = {
      userId: dto.userId,
      label: dto.label,
      prefix,
      scopes: dto.scopes,
      access: dto.access,
      expiresAt: dto.expiresAt,
    };
    this.eventEmitter.emit(PersonalApiKeyEvents.Created, event);

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

    await this.personalApiKeyModel.updateOne({ _id: key._id }, { revokedAt: new Date() }).exec();
    await this.personalApiKeyReadCachedService.invalidate(key.prefix);
  }
}
