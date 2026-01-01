import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ApiKeyEntity, ApiKeySchema } from '../core/entities/api-key.entity';
import { ApiKeyReadService } from './api-key-read.service';
import { ApiKeyReadCachedService } from './api-key-read-cached.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: ApiKeyEntity.name, schema: ApiKeySchema }])],
  providers: [ApiKeyReadService, ApiKeyReadCachedService],
  exports: [ApiKeyReadService, ApiKeyReadCachedService],
})
export class ApiKeyReadModule {}
