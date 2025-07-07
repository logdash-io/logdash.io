import { INestApplication } from '@nestjs/common';

import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserEntity } from '../../src/user/core/entities/user.entity';
import { UserNormalized } from '../../src/user/core/entities/user.interface';
import { UserSerializer } from '../../src/user/core/entities/user.serializer';
import { AccountClaimStatus } from '../../src/user/core/enum/account-claim-status.enum';
import { AuthMethod } from '../../src/user/core/enum/auth-method.enum';
import { UserTier } from '../../src/user/core/enum/user-tier.enum';

export class UserUtils {
  private userModel: Model<UserEntity>;

  constructor(private readonly app: INestApplication<any>) {
    this.userModel = this.app.get(getModelToken(UserEntity.name));
  }

  public async getUser(): Promise<UserNormalized | null> {
    const user = await this.userModel.findOne();
    return user ? UserSerializer.normalize(user) : null;
  }

  public async createDefaultUser(params?: {
    email?: string;
    authMethod?: AuthMethod;
    accountClaimStatus?: AccountClaimStatus;
    tier?: UserTier;
    stripeCustomerId?: string;
    avatarUrl?: string;
    marketingConsent?: boolean;
  }): Promise<UserNormalized> {
    const user = await this.userModel.create({
      email: params?.email || `test-user-${Math.random()}@example.com`,
      authMethod: params?.authMethod || AuthMethod.Traditional,
      accountClaimStatus: params?.accountClaimStatus || AccountClaimStatus.Claimed,
      lastActivityDate: new Date(),
      tier: params?.tier || UserTier.Free,
      stripeCustomerId: params?.stripeCustomerId,
      avatarUrl: params?.avatarUrl,
      marketingConsent: params?.marketingConsent || false,
    });

    return UserSerializer.normalize(user);
  }
}
