import { Injectable } from '@nestjs/common';
import { EventEmitter2 as EventEmitter } from '@nestjs/event-emitter';
import { UserTierChangedEvent } from '../../user/events/definitions/user-tier-changed.event';
import { UserTier } from '../../user/core/enum/user-tier.enum';

export enum StripeEvents {
  PaymentSucceeded = 'stripe.payment.succeeded',
  SubscriptionDeleted = 'stripe.subscription.deleted',
}

export interface StripePaymentSucceededEvent {
  email: string;
  tier: UserTier;
}

export interface StripeSubscriptionDeletedEvent {
  email: string;
}

@Injectable()
export class StripeEventEmitter {
  public constructor(private readonly eventEmitter: EventEmitter) {}

  public async emitPaymentSucceeded(payload: StripePaymentSucceededEvent): Promise<void> {
    await this.eventEmitter.emit(StripeEvents.PaymentSucceeded, payload);
  }

  public async emitSubscriptionDeleted(payload: StripeSubscriptionDeletedEvent): Promise<void> {
    await this.eventEmitter.emit(StripeEvents.SubscriptionDeleted, payload);
  }
}
