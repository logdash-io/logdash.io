import { Module } from '@nestjs/common';
import { ApiKeyEntity, ApiKeySchema } from '../core/entities/api-key.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { ApiKeyWriteService } from './api-key-write.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: ApiKeyEntity.name, schema: ApiKeySchema }])],
  providers: [ApiKeyWriteService],
  exports: [ApiKeyWriteService],
})
export class ApiKeyWriteModule {}
