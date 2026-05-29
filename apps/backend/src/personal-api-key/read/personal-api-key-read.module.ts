import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  PersonalApiKeyEntity,
  PersonalApiKeySchema,
} from '../core/entities/personal-api-key.entity';
import { PersonalApiKeyReadService } from './personal-api-key-read.service';
import { PersonalApiKeyReadCachedService } from './personal-api-key-read-cached.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PersonalApiKeyEntity.name, schema: PersonalApiKeySchema },
    ]),
  ],
  providers: [PersonalApiKeyReadService, PersonalApiKeyReadCachedService],
  exports: [PersonalApiKeyReadService, PersonalApiKeyReadCachedService],
})
export class PersonalApiKeyReadModule {}
