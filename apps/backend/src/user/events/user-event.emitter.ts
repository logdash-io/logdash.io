import { Injectable } from '@nestjs/common';
import { EventEmitter2 as EventEmitter } from '@nestjs/event-emitter';
import { UserEvents } from './user-events.enum';
import { UserTierChangedEvent } from './definitions/user-tier-changed.event';
import { MarketingConsentGivenEvent } from './definitions/marketing-consent-given.event';

@Injectable()
export class UserEventEmitter {
  public constructor(private readonly eventEmitter: EventEmitter) {}

  public emitUserTierChanged(payload: UserTierChangedEvent): void {
    this.eventEmitter.emit(UserEvents.UserTierChanged, payload);
  }

  public emitMarketingConsentGiven(payload: MarketingConsentGivenEvent): void {
    this.eventEmitter.emit(UserEvents.MarketingConsentGiven, payload);
  }
}
