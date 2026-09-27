import { Injectable } from '@nestjs/common';
import { EventEmitter2 as EventEmitter } from '@nestjs/event-emitter';
import { LogEvents } from './log-events.enum';
import { LogCreatedEvent } from './definitions/log-created.event';

@Injectable()
export class LogEventEmitter {
  public constructor(private readonly eventEmitter: EventEmitter) {}

  public emitLogCreatedEvent(payload: LogCreatedEvent): void {
    this.eventEmitter.emit(LogEvents.LogCreatedEvent, payload);
  }
}
