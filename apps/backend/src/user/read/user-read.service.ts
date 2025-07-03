import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserEntity } from '../core/entities/user.entity';
import { UserNormalized } from '../core/entities/user.interface';
import { UserSerializer } from '../core/entities/user.serializer';
import { AccountClaimStatus } from '../core/enum/account-claim-status.enum';

@Injectable()
export class UserReadService {
  constructor(@InjectModel(UserEntity.name) private userModel: Model<UserEntity>) {}

  public async readByIdOrThrow(id: string): Promise<UserNormalized> {
    const user = await this.userModel.findById(id).lean<UserEntity>().exec();

    if (!user) {
      throw new NotFoundException(`User not found`);
    }

    return UserSerializer.normalize(user);
  }

  public async readByEmail(email: string): Promise<UserNormalized | null> {
    const user = await this.userModel.findOne({ email }).lean<UserEntity>().exec();

    return user ? UserSerializer.normalize(user) : null;
  }

  public async readByStripeCustomerId(stripeCustomerId: string): Promise<UserNormalized | null> {
    const user = await this.userModel.findOne({ stripeCustomerId }).lean<UserEntity>().exec();

    return user ? UserSerializer.normalize(user) : null;
  }

  public async *readUnclaimedUserIdsCreatedBeforeCursor(date: Date): AsyncGenerator<string> {
    const cursor = this.userModel
      .find({
        accountClaimStatus: AccountClaimStatus.Anonymous,
        createdAt: { $lt: date },
      })
      .lean<UserEntity>()
      .cursor();

    for await (const user of cursor) {
      yield user._id.toString();
    }
  }
}
