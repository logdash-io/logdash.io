import { Injectable } from '@nestjs/common';
import { EventEmitter2 as EventEmitter } from '@nestjs/event-emitter';
import { UserEvents } from './user-events.enum';
import { UserTierChangedEvent } from './definitions/user-tier-changed.event';

@Injectable()
export class UserEventEmitter {
  public constructor(private readonly eventEmitter: EventEmitter) {}

  public async emitUserTierChanged(payload: UserTierChangedEvent): Promise<void> {
    await this.eventEmitter.emit(UserEvents.UserTierChanged, payload);
  }
}
