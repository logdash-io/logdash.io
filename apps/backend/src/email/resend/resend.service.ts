import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AuthEvents } from '../../auth/events/auth-events.enum';
import { UserRegisteredEvent } from '../../auth/events/definitions/user-registered.event';
import { Resend } from 'resend';
import { LogdashLogger } from '../../shared/logdash/aggregate-logger';
import { EMAILS_LOGGER } from '../../shared/logdash/logdash-tokens';
import { getEnvConfig } from '../../shared/configs/env-configs';
import { ResendTemplatedEmailsService } from './resend-templated-emails.service';
import {
  StripeEvents,
  StripePaymentSucceededEvent,
} from '../../payments/stripe/stripe-event.emitter';
import { UserEvents } from '../../user/events/user-events.enum';
import { MarketingConsentGivenEvent } from '../../user/events/definitions/marketing-consent-given.event';
import { PersonalApiKeyEvents } from '../../personal-api-key/events/personal-api-key-events.enum';
import { PersonalApiKeyCreatedEvent } from '../../personal-api-key/events/definitions/personal-api-key-created.event';
import { UserReadService } from '../../user/read/user-read.service';
import { errorMessage } from '../../shared/utils/error-message';

@Injectable()
export class ResendService {
  private resend = new Resend(getEnvConfig().resend.apiKey);

  constructor(
    @Inject(EMAILS_LOGGER) private readonly logger: LogdashLogger,
    private readonly resendTemplatedEmailsService: ResendTemplatedEmailsService,
    private readonly userReadService: UserReadService,
  ) {}

  @OnEvent(AuthEvents.UserRegistered)
  public async handleUserRegisteredEvent(dto: UserRegisteredEvent): Promise<void> {
    if (!getEnvConfig().resend.enabled) {
      this.logger.log('Skipping resend audience update...');
      return;
    }

    await this.resendTemplatedEmailsService.sendWelcomeEmail(dto.email);

    if (!dto.emailAccepted) {
      this.logger.log(
        `Skipping resend audience update for user because he didn't subscribe to newsletter`,
        { email: dto.email, userId: dto.userId },
      );
      return;
    }

    await this.addToNewsletterAudience(dto.userId, dto.email);
  }

  @OnEvent(UserEvents.MarketingConsentGiven)
  public async handleMarketingConsentGivenEvent(dto: MarketingConsentGivenEvent): Promise<void> {
    if (!getEnvConfig().resend.enabled) {
      this.logger.log('Skipping resend audience update...');
      return;
    }

    await this.addToNewsletterAudience(dto.userId, dto.email);
  }

  @OnEvent(StripeEvents.PaymentSucceeded)
  public async handlePaymentSucceededEvent(dto: StripePaymentSucceededEvent): Promise<void> {
    if (!getEnvConfig().resend.enabled) {
      return;
    }

    await this.resendTemplatedEmailsService.sendPaidPlanWelcomeEmail(dto.email);
  }

  @OnEvent(PersonalApiKeyEvents.Created)
  public async handlePersonalApiKeyCreatedEvent(dto: PersonalApiKeyCreatedEvent): Promise<void> {
    if (!getEnvConfig().resend.enabled) {
      return;
    }

    try {
      const user = await this.userReadService.readByIdOrThrow(dto.userId);

      if (!user.email) {
        return;
      }

      await this.resendTemplatedEmailsService.sendPersonalApiKeyCreatedEmail(user.email, dto);
    } catch (error) {
      this.logger.error('Failed to send personal API key created email', {
        userId: dto.userId,
        error: errorMessage(error),
      });
    }
  }

  private async addToNewsletterAudience(userId: string, email: string): Promise<void> {
    const { error } = await this.resend.contacts.create({
      email,
      unsubscribed: false,
      audienceId: '59130b80-b5df-4b37-83f2-fbb838ee98dd',
    });

    if (error) {
      this.logger.error(`Failed to update resend audience with user`, {
        email,
        userId,
        error: error.message,
      });
      return;
    }

    this.logger.log(`Resend audience updated with user`, { email, userId });
  }
}
