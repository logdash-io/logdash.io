import { Body, Controller, Delete, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { SuccessResponse } from 'src/shared/responses/success.response';
import { CreateNotificationsChannelBody } from './dto/create-notifications-channel.body';
import { UpdateNotificationsChannelBody } from './dto/update-notifications-channel.body';
import { NotificationsChannelReadService } from '../read/notifications-channel-read.service';
import { NotificationsChannelWriteService } from '../write/notifications-channel-write.service';
import { ClusterMemberGuard } from '../../cluster/guards/cluster-member/cluster-member.guard';
import { NotificationsChannelSerializer } from './entities/notifications-channel.serializer';
import { NotificationsChannelSerialized } from './entities/notifications-channel.interface';

@Controller()
@ApiTags('Notifications channels')
@UseGuards(ClusterMemberGuard)
export class NotificationsChannelCoreController {
  constructor(
    private readonly notificationsChannelReadService: NotificationsChannelReadService,
    private readonly notificationsChannelWriteService: NotificationsChannelWriteService,
  ) {}

  @Post('clusters/:clusterId/notifications_channels')
  @ApiResponse({ type: NotificationsChannelSerialized })
  public async create(
    @Param('clusterId') clusterId: string,
    @Body() dto: CreateNotificationsChannelBody,
  ): Promise<NotificationsChannelSerialized> {
    const channel = await this.notificationsChannelWriteService.create({
      clusterId,
      type: dto.type,
      options: dto.options,
    });

    return NotificationsChannelSerializer.serialize(channel);
  }

  @Put('notifications_channels/:id')
  public async update(
    @Param('id') id: string,
    @Body() dto: UpdateNotificationsChannelBody,
  ): Promise<void> {
    await this.notificationsChannelWriteService.update({
      id,
      options: dto.options,
    });
  }

  @Delete('notifications_channels/:id')
  @ApiResponse({ type: SuccessResponse })
  public async delete(@Param('id') id: string): Promise<SuccessResponse> {
    await this.notificationsChannelWriteService.delete(id);

    return new SuccessResponse();
  }
}
