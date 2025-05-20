import { Body, Controller, Get, Post, Put } from '@nestjs/common';
import { CurrentUserId } from '../../auth/core/decorators/current-user-id.decorator';
import { UserReadService } from '../read/user-read.service';
import { UserSerialized } from './entities/user.interface';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserSerializer } from './entities/user.serializer';
import { UpdatePublicUserBody } from './dto/update-public-user.body';
import { UserWriteService } from '../write/user-write.service';
import { AccountClaimStatus } from './enum/account-claim-status.enum';
import { TokenResponse } from '../../shared/responses/token.response';
import { CustomJwtService } from '../../auth/custom-jwt/custom-jwt.service';
import { Public } from '../../auth/core/decorators/is-public';
import { CreateAnonymousUserResponse } from './dto/create-anonymous-user.response';
import { ClusterWriteService } from '../../cluster/write/cluster-write.service';
import { ClusterTier } from '../../cluster/core/enums/cluster-tier.enum';
import { ClusterSerializer } from '../../cluster/core/entities/cluster.serializer';

@Controller('users')
@ApiTags('Users')
@ApiBearerAuth()
export class UserCoreController {
  constructor(
    private readonly userReadService: UserReadService,
    private readonly userWriteService: UserWriteService,
    private readonly jwtService: CustomJwtService,
    private readonly clusterWriteService: ClusterWriteService,
  ) {}

  @Get('me')
  @ApiResponse({ type: UserSerialized })
  public async readCurrentUser(
    @CurrentUserId() userId,
  ): Promise<UserSerialized> {
    const user = await this.userReadService.readById(userId);

    return UserSerializer.serialize(user);
  }

  @Put('me')
  @ApiResponse({ type: UserSerialized })
  public async updateCurrentUser(
    @CurrentUserId() userId,
    @Body() dto: UpdatePublicUserBody,
  ): Promise<UserSerialized> {
    const user = await this.userReadService.readById(userId);

    return UserSerializer.serialize(user);
  }

  @Public()
  @Post('anonymous')
  @ApiResponse({ type: CreateAnonymousUserResponse })
  public async createAnonymousUser(): Promise<CreateAnonymousUserResponse> {
    const user = await this.userWriteService.create({
      accountClaimStatus: AccountClaimStatus.Anonymous,
    });

    const token = await this.jwtService.sign({ id: user.id });

    const cluster = await this.clusterWriteService.create({
      name: 'My first cluster',
      creatorId: user.id,
      tier: ClusterTier.Free,
    });

    return {
      user: UserSerializer.serialize(user),
      cluster: ClusterSerializer.serialize(cluster),
      token,
    };
  }
}
