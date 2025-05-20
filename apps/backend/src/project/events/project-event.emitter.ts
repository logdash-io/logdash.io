import { Injectable } from '@nestjs/common';
import { EventEmitter2 as EventEmitter } from '@nestjs/event-emitter';
import { UserAddedToProjectEvent } from './definitions/user-added-to-project.event';
import { ProjectEvents } from './project-events.enum';

@Injectable()
export class ProjectEventEmitter {
  public constructor(private readonly eventEmitter: EventEmitter) {}

  public async emitUserAddedToProjectEvent(
    payload: UserAddedToProjectEvent,
  ): Promise<void> {
    await this.eventEmitter.emit(ProjectEvents.UserAddedToProject, payload);
  }
}
