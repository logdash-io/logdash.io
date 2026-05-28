import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  PersonalApiKeyEntity,
  PersonalApiKeySchema,
} from '../core/entities/personal-api-key.entity';
import { PersonalApiKeyWriteService } from './personal-api-key-write.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PersonalApiKeyEntity.name, schema: PersonalApiKeySchema },
    ]),
  ],
  providers: [PersonalApiKeyWriteService],
  exports: [PersonalApiKeyWriteService],
})
export class PersonalApiKeyWriteModule {}
