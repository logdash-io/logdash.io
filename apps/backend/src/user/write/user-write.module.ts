import { Module } from '@nestjs/common';
import { UserWriteService } from './user-write.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UserEntity, UserSchema } from '../core/entities/user.entity';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: UserEntity.name, schema: UserSchema }]),
  ],
  providers: [UserWriteService],
  exports: [UserWriteService],
})
export class UserWriteModule {}
