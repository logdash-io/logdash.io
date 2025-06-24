import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { SuccessResponse } from 'src/shared/responses/success.response';
import { CreateNotificationChannelBody } from './dto/create-notification-channel.body';
import { UpdateNotificationChannelBody } from './dto/update-notification-channel.body';
import { NotificationChannelWriteService } from '../write/notification-channel-write.service';
import { ClusterMemberGuard } from '../../cluster/guards/cluster-member/cluster-member.guard';
import { NotificationChannelSerializer } from './entities/notification-channel.serializer';
import { NotificationChannelSerialized } from './entities/notification-channel.interface';
import { NotificationChannelOptionsEnrichmentService } from './notification-channel-options-enrichment.service';
import { NotificationChannelReadService } from '../read/notification-channel-read.service';
import { CurrentUserId } from '../../auth/core/decorators/current-user-id.decorator';
import { NotificationChannelOptionsValidationService } from './notification-channel-options-validation.service';
import { NotificationChannelMessagingService } from '../messaging/notification-channel-messaging.service';

@Controller()
@ApiTags('Notification channels')
export class NotificationChannelCoreController {
  constructor(
    private readonly notificationChannelWriteService: NotificationChannelWriteService,
    private readonly notificationChannelOptionsEnrichmentService: NotificationChannelOptionsEnrichmentService,
    private readonly notificationChannelReadService: NotificationChannelReadService,
    private readonly notificationChannelOptionsValidationService: NotificationChannelOptionsValidationService,
    private readonly notificationChannelMessagingService: NotificationChannelMessagingService,
  ) {}

  @UseGuards(ClusterMemberGuard)
  @Post('clusters/:clusterId/notification_channels')
  @ApiResponse({ type: NotificationChannelSerialized })
  public async create(
    @Param('clusterId') clusterId: string,
    @Body() dto: CreateNotificationChannelBody,
    @CurrentUserId() userId: string,
  ): Promise<NotificationChannelSerialized> {
    const boundToClusterCount =
      await this.notificationChannelReadService.countByClusterId(clusterId);

    if (boundToClusterCount >= 100) {
      throw new BadRequestException('Cannot create more than 100 notification channels');
    }

    await this.notificationChannelOptionsValidationService.validateOptions(
      dto.options,
      dto.type,
      clusterId,
    );

    const enrichedOptions = await this.notificationChannelOptionsEnrichmentService.enrichOptions(
      dto.options,
      dto.type,
    );

    const channel = await this.notificationChannelWriteService.create(
      {
        clusterId,
        type: dto.type,
        name: dto.name,
        options: enrichedOptions,
      },
      userId,
    );

    await this.notificationChannelMessagingService.sendWelcomeMessage(channel.id);

    return NotificationChannelSerializer.serialize(channel);
  }

  @UseGuards(ClusterMemberGuard)
  @Put('notification_channels/:notificationChannelId')
  public async update(
    @Param('notificationChannelId') id: string,
    @Body() dto: UpdateNotificationChannelBody,
    @CurrentUserId() userId: string,
  ): Promise<void> {
    await this.notificationChannelWriteService.update(
      {
        id,
        options: dto.options,
      },
      userId,
    );
  }

  @UseGuards(ClusterMemberGuard)
  @Delete('notification_channels/:notificationChannelId')
  @ApiResponse({ type: SuccessResponse })
  public async delete(
    @Param('notificationChannelId') id: string,
    @CurrentUserId() userId: string,
  ): Promise<SuccessResponse> {
    await this.notificationChannelWriteService.delete(id, userId);

    return new SuccessResponse();
  }

  @UseGuards(ClusterMemberGuard)
  @ApiResponse({ type: NotificationChannelSerialized, isArray: true })
  @Get('clusters/:clusterId/notification_channels')
  public async getByClusterId(
    @Param('clusterId') clusterId: string,
  ): Promise<NotificationChannelSerialized[]> {
    const channels = await this.notificationChannelReadService.readByClusterId(clusterId);

    return channels.map(NotificationChannelSerializer.serialize);
  }
}
