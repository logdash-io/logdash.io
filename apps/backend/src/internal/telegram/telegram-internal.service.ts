import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  StripeEvents,
  StripePaymentSucceededEvent,
  StripeSubscriptionDeletedEvent,
} from '../../payments/stripe/stripe-event.emitter';
import { getEnvConfig } from '../../shared/configs/env-configs';
import axios from 'axios';

@Injectable()
export class TelegramInternalService {
  constructor() {}

  @OnEvent(StripeEvents.PaymentSucceeded)
  public async handlePaymentSucceeded(payload: StripePaymentSucceededEvent) {
    await this.sendMessage(
      `🎉🎉🎉 User ${this.escapeTelegramMessage(payload.email)} got upgraded to ${this.escapeTelegramMessage(payload.tier)} 🎉🎉🎉`,
    );
  }

  @OnEvent(StripeEvents.SubscriptionDeleted)
  public async handleSubscriptionDeleted(payload: StripeSubscriptionDeletedEvent) {
    await this.sendMessage(
      `User ${this.escapeTelegramMessage(payload.email)} stripe subscription deleted`,
    );
  }

  public async sendMessage(message: string): Promise<void> {
    const token = getEnvConfig().internal.telegram.botToken;
    const chatId = getEnvConfig().internal.telegram.chatId;
    const url = `https://api.telegram.org/bot${token}/sendMessage?parse_mode=MarkdownV2`;

    await axios.post(url, {
      chat_id: chatId,
      text: message,
    });
  }

  private escapeTelegramMessage(message: string): string {
    return message.replace(/[_*[\]()~`>#+-=|{}.!&]/g, '\\$&');
  }
}
