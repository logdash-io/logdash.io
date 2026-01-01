import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AuthEvents } from '../../auth/events/auth-events.enum';
import { UserLoggedInEvent } from '../../auth/events/definitions/user-logged-in.event';
import { UserWriteService } from '../write/user-write.service';

@Injectable()
export class UserCoreEventController {
  constructor(private readonly userWriteService: UserWriteService) {}

  @OnEvent(AuthEvents.UserLoggedInEvent)
  public async handleUserLoggedInEvent(payload: UserLoggedInEvent): Promise<void> {
    await this.userWriteService.updateLastActivityDate(payload.userId, new Date());
  }
}
