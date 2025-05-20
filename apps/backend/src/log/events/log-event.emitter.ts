import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { EventEmitter2 as EventEmitter, OnEvent } from '@nestjs/event-emitter';
import { LogEvents } from './log-events.enum';
import { LogCreatedEvent } from './definitions/log-created.event';

@Injectable()
export class LogEventEmitter {
  public constructor(private readonly eventEmitter: EventEmitter) {}

  public async emitLogCreatedEvent(payload: LogCreatedEvent): Promise<void> {
    this.eventEmitter.emit(LogEvents.LogCreatedEvent, payload);
  }
}
