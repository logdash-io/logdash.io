import { Injectable } from '@nestjs/common';
import { EventEmitter2 as EventEmitter } from '@nestjs/event-emitter';
import { MetricEvents } from './metric-events.enum';
import { MetricCreatedEvent } from './definitions/metric-created.event';

@Injectable()
export class MetricEventEmitter {
  public constructor(private readonly eventEmitter: EventEmitter) {}

  public emitMetricCreatedEvents(dtos: MetricCreatedEvent[]): void {
    for (const dto of dtos) {
      this.eventEmitter.emit(MetricEvents.MetricCreatedEvent, dto);
    }
  }
}
