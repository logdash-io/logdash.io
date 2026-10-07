import { BadGatewayException, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  StripeEvents,
  StripePaymentSucceededEvent,
  StripeSubscriptionDeletedEvent,
} from '../../payments/stripe/stripe-event.emitter';
import { getEnvConfig } from '../../shared/configs/env-configs';
import { maskEmail } from '../../shared/utils/mask-email';
import axios from 'axios';

@Injectable()
export class TelegramInternalService {
  @OnEvent(StripeEvents.PaymentSucceeded)
  public async handlePaymentSucceeded(payload: StripePaymentSucceededEvent): Promise<void> {
    await this.sendMessage(
      `🎉🎉🎉 User ${this.escapeTelegramMessage(maskEmail(payload.email))} got upgraded to ${this.escapeTelegramMessage(payload.tier)} 🎉🎉🎉`,
    );
  }

  @OnEvent(StripeEvents.SubscriptionDeleted)
  public async handleSubscriptionDeleted(payload: StripeSubscriptionDeletedEvent): Promise<void> {
    await this.sendMessage(
      `User ${this.escapeTelegramMessage(maskEmail(payload.email))} stripe subscription deleted`,
    );
  }

  public async sendFeedback(dto: {
    message: string;
    rating: number;
    email?: string;
  }): Promise<void> {
    const stars = '★'.repeat(dto.rating) + '☆'.repeat(5 - dto.rating);
    const sender = dto.email ? maskEmail(dto.email) : 'an anonymous user';

    await this.sendMessage(
      this.escapeTelegramMessage(`💬 Feedback ${stars} from ${sender}\n\n${dto.message}`),
    );
  }

  public async sendMessage(message: string): Promise<void> {
    const { botToken: token, chatId } = getEnvConfig().internal.telegram;

    if (!token) {
      return;
    }

    const url = `https://api.telegram.org/bot${token}/sendMessage?parse_mode=MarkdownV2`;

    try {
      await axios.post(url, {
        chat_id: chatId,
        text: message,
      });
    } catch (error) {
      const status = axios.isAxiosError(error) ? error.response?.status : undefined;

      throw new BadGatewayException(
        `Telegram rejected the message with ${status ?? 'no response'}`,
      );
    }
  }

  private escapeTelegramMessage(message: string): string {
    return message.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, '\\$&');
  }
}
