import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CustomDomainEntity, CustomDomainSchema } from '../core/entities/custom-domain.entity';
import { CustomDomainWriteService } from './custom-domain-write.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: CustomDomainEntity.name, schema: CustomDomainSchema }]),
  ],
  providers: [CustomDomainWriteService],
  exports: [CustomDomainWriteService],
})
export class CustomDomainWriteModule {}
