import { Injectable } from '@nestjs/common';
import { EventEmitter2 as EventEmitter } from '@nestjs/event-emitter';
import { HttpPingCreatedEvent } from './definitions/http-ping-created.event';
import { HttpPingEvent } from './http-ping-event.enum';

@Injectable()
export class HttpPingEventEmitter {
  public constructor(private readonly eventEmitter: EventEmitter) {}

  public emitHttpPingCreatedEvent(payload: HttpPingCreatedEvent): void {
    this.eventEmitter.emit(HttpPingEvent.HttpPingCreatedEvent, payload);
  }
}
