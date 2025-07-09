import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  NotFoundException,
  UseGuards,
  Body,
  BadRequestException,
  ConflictException,
  Query,
  ForbiddenException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CustomDomainReadService } from '../read/custom-domain-read.service';
import { CustomDomainWriteService } from '../write/custom-domain-write.service';
import { CustomDomainSerialized } from './entities/custom-domain.interface';
import { CustomDomainSerializer } from './entities/custom-domain.serializer';
import { ClusterMemberGuard } from '../../cluster/guards/cluster-member/cluster-member.guard';
import { CreateCustomDomainBody } from './dto/create-custom-domain.body';
import { PublicDashboardReadService } from '../../public-dashboard/read/public-dashboard-read.service';
import { Public } from '../../auth/core/decorators/is-public';
import { CustomDomainVerificationService } from '../verification/custom-domain-verification.service';

@ApiTags('Custom Domains')
@Controller()
export class CustomDomainCoreController {
  constructor(
    private readonly customDomainReadService: CustomDomainReadService,
    private readonly customDomainWriteService: CustomDomainWriteService,
    private readonly publicDashboardReadService: PublicDashboardReadService,
    private readonly customDomainVerificationService: CustomDomainVerificationService,
  ) {}

  @UseGuards(ClusterMemberGuard)
  @ApiBearerAuth()
  @Post('/public_dashboards/:publicDashboardId/custom_domains')
  public async create(
    @Param('publicDashboardId') publicDashboardId: string,
    @Body() body: CreateCustomDomainBody,
  ): Promise<CustomDomainSerialized> {
    const publicDashboard = await this.publicDashboardReadService.readById(publicDashboardId);

    if (!publicDashboard) {
      throw new NotFoundException('Public dashboard not found');
    }

    const existingDomainByName = await this.customDomainReadService.readByDomain(body.domain);
    if (existingDomainByName) {
      throw new ConflictException('Domain already exists');
    }

    const existingDomainByDashboard =
      await this.customDomainReadService.readByPublicDashboardId(publicDashboardId);
    if (existingDomainByDashboard) {
      throw new ConflictException('Public dashboard already has a custom domain');
    }

    const customDomain = await this.customDomainWriteService.create({
      domain: body.domain,
      publicDashboardId,
    });

    return CustomDomainSerializer.serialize(customDomain);
  }

  @UseGuards(ClusterMemberGuard)
  @ApiBearerAuth()
  @Get('/public_dashboards/:publicDashboardId/custom_domain')
  @ApiResponse({ type: CustomDomainSerialized })
  public async readByPublicDashboardId(
    @Param('publicDashboardId') publicDashboardId: string,
  ): Promise<CustomDomainSerialized> {
    const customDomain =
      await this.customDomainReadService.readByPublicDashboardId(publicDashboardId);

    if (!customDomain) {
      throw new NotFoundException('Custom domain not found');
    }

    return CustomDomainSerializer.serialize(customDomain);
  }

  @UseGuards(ClusterMemberGuard)
  @ApiBearerAuth()
  @Delete('/custom_domains/:customDomainId')
  public async delete(@Param('customDomainId') customDomainId: string): Promise<void> {
    const customDomain = await this.customDomainReadService.readById(customDomainId);

    if (!customDomain) {
      throw new NotFoundException('Custom domain not found');
    }

    await this.customDomainWriteService.delete(customDomainId);
  }

  @Public()
  @Get('/custom_domains/check')
  public async checkDomain(@Query('domain') domain: string) {
    const isVerified = await this.customDomainVerificationService.isVerified(domain);

    if (!isVerified) {
      throw new ForbiddenException('Domain not verified');
    }

    return {
      message: 'OK',
    };
  }
}
