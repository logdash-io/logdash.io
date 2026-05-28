import { Module } from '@nestjs/common';
import { PersonalApiKeyReadModule } from '../read/personal-api-key-read.module';
import { PersonalApiKeyWriteModule } from '../write/personal-api-key-write.module';
import { PersonalApiKeyCoreController } from './personal-api-key-core.controller';

@Module({
  imports: [PersonalApiKeyReadModule, PersonalApiKeyWriteModule],
  controllers: [PersonalApiKeyCoreController],
  providers: [],
})
export class PersonalApiKeyCoreModule {}
