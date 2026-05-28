import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  PersonalApiKeyEntity,
  PersonalApiKeySchema,
} from '../core/entities/personal-api-key.entity';
import { PersonalApiKeyReadModule } from '../read/personal-api-key-read.module';
import { PersonalApiKeyAuthService } from './personal-api-key-auth.service';

@Module({
  imports: [
    PersonalApiKeyReadModule,
    MongooseModule.forFeature([
      { name: PersonalApiKeyEntity.name, schema: PersonalApiKeySchema },
    ]),
  ],
  providers: [PersonalApiKeyAuthService],
  exports: [PersonalApiKeyAuthService],
})
export class PersonalApiKeyAuthModule {}
