import { Module } from '@nestjs/common';
import { UserReadService } from './user-read.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UserEntity, UserSchema } from '../core/entities/user.entity';
import { UserReadCachedService } from './user-read-cached.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: UserEntity.name, schema: UserSchema }])],
  providers: [UserReadService, UserReadCachedService],
  exports: [UserReadService, UserReadCachedService],
})
export class UserReadModule {}
