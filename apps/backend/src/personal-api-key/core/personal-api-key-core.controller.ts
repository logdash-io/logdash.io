import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuditLog } from '../../audit-log/creation/audit-log-creation.service';
import { AuditLogEntityAction } from '../../audit-log/core/enums/audit-log-actions.enum';
import { Actor } from '../../audit-log/core/enums/actor.enum';
import { RelatedDomain } from '../../audit-log/core/enums/related-domain.enum';
import { CurrentUserId } from '../../auth/core/decorators/current-user-id.decorator';
import { AllowAnyPersonalKey } from '../../auth/core/decorators/allow-any-personal-key.decorator';
import { PersonalApiKeyReadService } from '../read/personal-api-key-read.service';
import { PersonalApiKeyWriteService } from '../write/personal-api-key-write.service';
import { CreatePersonalApiKeyBody } from './dto/create-personal-api-key.body';
import { CreatePersonalApiKeyResponse } from './dto/create-personal-api-key.response';
import { WhoamiResponse } from './dto/whoami.response';
import { PersonalApiKeySerialized } from './entities/personal-api-key.interface';
import { PersonalApiKeySerializer } from './entities/personal-api-key.serializer';
import { ALL_ACCESS } from './scope-presets';
import { AccessRestriction } from './types/access-restriction.type';
import { ScopeEntry } from './types/scope-entry.type';

@Controller('personal-api-keys')
@ApiTags('Personal API keys')
@ApiBearerAuth()
export class PersonalApiKeyCoreController {
  constructor(
    private readonly personalApiKeyReadService: PersonalApiKeyReadService,
    private readonly personalApiKeyWriteService: PersonalApiKeyWriteService,
    private readonly auditLog: AuditLog,
  ) {}

  @Post()
  @ApiResponse({ type: CreatePersonalApiKeyResponse })
  public async create(
    @CurrentUserId() userId: string,
    @Body() body: CreatePersonalApiKeyBody,
  ): Promise<CreatePersonalApiKeyResponse> {
    const { key, value } = await this.personalApiKeyWriteService.create({
      userId,
      label: body.label,
      scopes: body.scopes,
      access: body.access,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
    });

    await this.auditLog.create({
      userId,
      actor: Actor.User,
      action: AuditLogEntityAction.Create,
      relatedDomain: RelatedDomain.PersonalApiKey,
      relatedEntityId: key.id,
    });

    return {
      id: key.id,
      prefix: key.prefix,
      value,
      label: key.label,
      scopes: key.scopes,
      access: key.access,
      expiresAt: key.expiresAt,
      createdAt: key.createdAt,
    };
  }

  @Get()
  @ApiResponse({ type: PersonalApiKeySerialized, isArray: true })
  public async list(
    @CurrentUserId() userId: string,
  ): Promise<PersonalApiKeySerialized[]> {
    const keys = await this.personalApiKeyReadService.readByUserId(userId);

    return keys.map((key) => PersonalApiKeySerializer.serialize(key));
  }

  @Delete(':id')
  @HttpCode(204)
  public async revoke(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
  ): Promise<void> {
    await this.personalApiKeyWriteService.revoke({ id, userId });

    await this.auditLog.create({
      userId,
      actor: Actor.User,
      action: AuditLogEntityAction.Delete,
      relatedDomain: RelatedDomain.PersonalApiKey,
      relatedEntityId: id,
    });
  }

  @Get('whoami')
  @AllowAnyPersonalKey()
  @ApiResponse({ type: WhoamiResponse })
  public async whoami(
    @CurrentUserId() userId: string,
    @Req() request: { user?: { id: string; scopes?: ScopeEntry[]; access?: AccessRestriction } },
  ): Promise<WhoamiResponse> {
    const user = request.user;

    return {
      userId,
      scopes: user?.scopes ?? ALL_ACCESS,
      access: user?.access ?? { kind: 'all' },
    };
  }
}
