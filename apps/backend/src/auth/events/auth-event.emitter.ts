import { Injectable } from '@nestjs/common';
import { UserLoggedInEvent } from './definitions/user-logged-in.event';
import { EventEmitter2 as EventEmitter } from '@nestjs/event-emitter';
import { UserRegisteredEvent } from './definitions/user-registered.event';
import { AuthEvents } from './auth-events.enum';

@Injectable()
export class AuthEventEmitter {
  public constructor(private readonly eventEmitter: EventEmitter) {}

  public emitUserLoggedInEvent(payload: UserLoggedInEvent): void {
    this.eventEmitter.emit(AuthEvents.UserLoggedInEvent, payload);
  }

  public emitUserRegisteredEvent(payload: UserRegisteredEvent): void {
    this.eventEmitter.emit(AuthEvents.UserRegistered, payload);
  }
}
