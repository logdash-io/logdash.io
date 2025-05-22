import { Injectable } from '@nestjs/common';
import { EventEmitter2 as EventEmitter } from '@nestjs/event-emitter';
import { HttpPingCreatedEvent } from './definitions/http-ping-created.event';
import { HttpPingEvent } from './http-ping-event.enum';

@Injectable()
export class HttpPingEventEmitter {
  public constructor(private readonly eventEmitter: EventEmitter) {}

  public async emitHttpPingCreatedEvent(payload: HttpPingCreatedEvent): Promise<void> {
    this.eventEmitter.emit(HttpPingEvent.HttpPingCreatedEvent, payload);
  }
}
