import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, UpdateQuery } from 'mongoose';
import { UserEntity } from '../core/entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UserNormalized } from '../core/entities/user.interface';
import { UserSerializer } from '../core/entities/user.serializer';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserTier } from '../core/enum/user-tier.enum';

@Injectable()
export class UserWriteService {
  constructor(
    @InjectModel(UserEntity.name) private userModel: Model<UserEntity>,
  ) {}

  public async create(dto: CreateUserDto): Promise<UserNormalized> {
    const user = await this.userModel.create({
      email: dto.email,
      passwordHash: dto.passwordHash,
      authMethod: dto.authMethod,
      lastActivityDate: new Date(),
      accountClaimStatus: dto.accountClaimStatus,
      tier: UserTier.Free,
      avatarUrl: dto.avatarUrl,
      marketingConsent: dto.marketingConsent,
    });

    return UserSerializer.normalize(user);
  }

  public async update(dto: UpdateUserDto): Promise<UserNormalized> {
    const updateQuery: UpdateQuery<UserEntity> = {};

    if (dto.email) {
      updateQuery.email = dto.email;
    }

    if (dto.authMethod) {
      updateQuery.authMethod = dto.authMethod;
    }

    if (dto.accountClaimStatus) {
      updateQuery.accountClaimStatus = dto.accountClaimStatus;
    }

    if (dto.tier) {
      updateQuery.tier = dto.tier;
    }

    if (dto.stripeCustomerId) {
      updateQuery.stripeCustomerId = dto.stripeCustomerId;
    }

    if (dto.avatarUrl) {
      updateQuery.avatarUrl = dto.avatarUrl;
    }

    if (dto.marketingConsent) {
      updateQuery.marketingConsent = dto.marketingConsent;
    }

    const user = await this.userModel.findOneAndUpdate(
      { _id: new Types.ObjectId(dto.id) },
      updateQuery,
      { new: true },
    );

    if (!user) {
      throw new Error(`User with id ${dto.id} not found for update`);
    }

    return UserSerializer.normalize(user);
  }

  public async updateLastActivityDate(
    userId: string,
    date: Date,
  ): Promise<void> {
    await this.userModel.updateOne(
      { _id: new Types.ObjectId(userId) },
      { lastActivityDate: date },
    );
  }

  public async delete(userId: string): Promise<void> {
    await this.userModel.deleteOne({ _id: new Types.ObjectId(userId) });
  }
}
