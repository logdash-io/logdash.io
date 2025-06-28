import { Injectable } from '@nestjs/common';
import { NotificationChannelType } from './enums/notification-target.enum';
import { UserTier } from '../../user/core/enum/user-tier.enum';
import { getUserPlanConfig } from '../../shared/configs/user-plan-configs';

@Injectable()
export class NotificationChannelTierValidationService {
  public isNotificationChannelTypeAllowedForTier(
    notificationChannelType: NotificationChannelType,
    userTier: UserTier,
  ): boolean {
    const planConfig = getUserPlanConfig(userTier);
    return planConfig.notificationChannels.allowedTypes.includes(notificationChannelType);
  }
}
