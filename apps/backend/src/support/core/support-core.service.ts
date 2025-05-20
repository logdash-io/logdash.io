import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { SupportInviteLinkEntity } from './entities/support-invite-link.entity';
import { Model } from 'mongoose';
import { EnvConfigs, getEnvConfig } from '../../shared/configs/env-configs';
import { getOurEnv } from '../../shared/types/our-env.enum';
import { UserReadService } from '../../user/read/user-read.service';
import { UserTier } from '../../user/core/enum/user-tier.enum';

@Injectable()
export class SupportCoreService {
  constructor(
    @InjectModel(SupportInviteLinkEntity.name)
    private model: Model<SupportInviteLinkEntity>,
    private readonly userReadService: UserReadService,
  ) {}

  public async getTelegramSupportInviteLink(userId: string): Promise<string> {
    const user = await this.userReadService.readById(userId);

    if (user.tier === UserTier.Free) {
      throw new ForbiddenException(
        'User with free tier is not allowed to create support invite link',
      );
    }

    const entity = await this.model.findOne({ userId });

    if (entity) {
      return entity.url;
    }

    return this.generateTelegramSupportInviteLink(userId);
  }

  private async generateTelegramSupportInviteLink(userId: string): Promise<string> {
    const token = getEnvConfig().telegram.token;
    const url = `https://api.telegram.org/bot${token}/createChatInviteLink`;
    const chatId = getEnvConfig().telegram.chatId;

    const params = {
      chat_id: chatId,
      member_limit: 1,
      expiration_date: 0,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const data = await response.json();

    const inviteLinkUrl = data.result.invite_link;

    await this.model.create({
      userId,
      url: inviteLinkUrl,
    });

    return inviteLinkUrl;
  }
}
