import { Injectable } from '@nestjs/common';
import { EventEmitter2 as EventEmitter } from '@nestjs/event-emitter';
import { LogMetricEvents } from './log-metric-events.enum';
import { LogMetricCreatedEvent } from './definitions/log-metric-created.event';

@Injectable()
export class LogMetricEventEmitter {
  public constructor(private readonly eventEmitter: EventEmitter) {}

  public emitLogMetricCreatedEvents(dtos: LogMetricCreatedEvent[]): void {
    for (const dto of dtos) {
      this.eventEmitter.emit(LogMetricEvents.LogMetricCreatedEvent, dto);
    }
  }
}
