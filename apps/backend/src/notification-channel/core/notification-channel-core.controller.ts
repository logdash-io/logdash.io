import { Body, Controller, Delete, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { SuccessResponse } from 'src/shared/responses/success.response';
import { CreateNotificationChannelBody } from './dto/create-notification-channel.body';
import { UpdateNotificationChannelBody } from './dto/update-notification-channel.body';
import { NotificationChannelReadService } from '../read/notification-channel-read.service';
import { NotificationChannelWriteService } from '../write/notification-channel-write.service';
import { ClusterMemberGuard } from '../../cluster/guards/cluster-member/cluster-member.guard';
import { NotificationChannelSerializer } from './entities/notification-channel.serializer';
import { NotificationChannelSerialized } from './entities/notification-channel.interface';

@Controller()
@ApiTags('Notification channels')
@UseGuards(ClusterMemberGuard)
export class NotificationChannelCoreController {
  constructor(
    private readonly notificationChannelReadService: NotificationChannelReadService,
    private readonly notificationChannelWriteService: NotificationChannelWriteService,
  ) {}

  @Post('clusters/:clusterId/notification_channels')
  @ApiResponse({ type: NotificationChannelSerialized })
  public async create(
    @Param('clusterId') clusterId: string,
    @Body() dto: CreateNotificationChannelBody,
  ): Promise<NotificationChannelSerialized> {
    const channel = await this.notificationChannelWriteService.create({
      clusterId,
      type: dto.type,
      options: dto.options,
    });

    return NotificationChannelSerializer.serialize(channel);
  }

  @Put('notification_channels/:id')
  public async update(
    @Param('id') id: string,
    @Body() dto: UpdateNotificationChannelBody,
  ): Promise<void> {
    await this.notificationChannelWriteService.update({
      id,
      options: dto.options,
    });
  }

  @Delete('notification_channels/:id')
  @ApiResponse({ type: SuccessResponse })
  public async delete(@Param('id') id: string): Promise<SuccessResponse> {
    await this.notificationChannelWriteService.delete(id);

    return new SuccessResponse();
  }
}
