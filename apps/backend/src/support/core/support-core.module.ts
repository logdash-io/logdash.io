import { Module } from '@nestjs/common';
import { SupportCoreService } from './support-core.service';
import { SupportCoreController } from './support-core.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  SupportInviteLinkEntity,
  SupportinviteLinkSchema,
} from './entities/support-invite-link.entity';
import { UserReadModule } from '../../user/read/user-read.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SupportInviteLinkEntity.name, schema: SupportinviteLinkSchema },
    ]),
    UserReadModule,
  ],
  providers: [SupportCoreService],
  controllers: [SupportCoreController],
})
export class SupportCoreModule {}
