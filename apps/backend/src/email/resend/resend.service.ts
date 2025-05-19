import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AuthEvents } from '../../auth/events/auth-events.enum';
import { UserRegisteredEvent } from '../../auth/events/definitions/user-registered.event';
import { Resend } from 'resend';
import { Logger } from '@logdash/js-sdk';
import { getEnvConfig } from '../../shared/configs/env-configs';

@Injectable()
export class ResendService {
  private resend = new Resend(getEnvConfig().resend.apiKey);

  constructor(private readonly logger: Logger) {}

  @OnEvent(AuthEvents.UserRegistered)
  public async handleUserRegisteredEvent(dto: UserRegisteredEvent): Promise<void> {
    if (getEnvConfig().resend.enabled) {
      this.logger.log('Skipping resend audience update...');
      return;
    }

    if (!dto.emailAccepted) {
      this.logger.log(
        `Skipping resend audience update for user because he didn't subscribe to newsletter`,
        { email: dto.email, userId: dto.userId },
      );
      return;
    }

    const { data, error } = await this.resend.contacts.create({
      email: dto.email,
      unsubscribed: false,
      audienceId: '59130b80-b5df-4b37-83f2-fbb838ee98dd',
    });

    if (error) {
      this.logger.error(`Failed to update resend audience with user`, {
        email: dto.email,
        userId: dto.userId,
        error: error.message,
      });
      return;
    }

    this.logger.log(`Resend audience updated with user`, {
      email: dto.email,
      userId: dto.userId,
    });
  }
}
