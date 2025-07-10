import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CustomDomainEntity, CustomDomainSchema } from '../core/entities/custom-domain.entity';
import { CustomDomainReadService } from './custom-domain-read.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: CustomDomainEntity.name, schema: CustomDomainSchema }]),
  ],
  providers: [CustomDomainReadService],
  exports: [CustomDomainReadService],
})
export class CustomDomainReadModule {}
