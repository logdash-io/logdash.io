import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  StripeEvents,
  StripePaymentSucceededEvent,
} from '../../payments/stripe/stripe-event.emitter';
import { UserReadService } from '../read/user-read.service';
import { LogdashLogger } from '../../shared/logdash/aggregate-logger';
import { USERS_LOGGER } from '../../shared/logdash/logdash-tokens';
import { UserWriteService } from '../write/user-write.service';

@Injectable()
export class UserCoreService {
  constructor(
    private readonly userReadService: UserReadService,
    private readonly userWriteService: UserWriteService,
    @Inject(USERS_LOGGER) private readonly logger: LogdashLogger,
  ) {}

  @OnEvent(StripeEvents.PaymentSucceeded)
  public async handlePaymentSucceeded(event: StripePaymentSucceededEvent): Promise<void> {
    const user = await this.userReadService.readByEmail(event.email);

    if (!user) {
      this.logger.error(`[STRIPE] User not found`, {
        email: event.email,
      });

      return;
    }

    await this.userWriteService.updateTrialUsed(user.id, true);
  }
}
