import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CustomJwtService } from '../custom-jwt/custom-jwt.service';
import { UserReadService } from '../../user/read/user-read.service';
import { UserWriteService } from '../../user/write/user-write.service';
import { GoogleClaimProjectBody } from './dto/google-claim-project.body';
import { AccountClaimStatus } from '../../user/core/enum/account-claim-status.enum';
import { AuthMethod } from '../../user/core/enum/auth-method.enum';
import { AuthEventEmitter } from '../events/auth-event.emitter';
import { ProjectLimitService } from '../../project/limit/project-limit-service';
import { TokenResponse } from '../../shared/responses/token.response';
import { UserNormalized } from '../../user/core/entities/user.interface';
import { JwtPayloadDto } from '../custom-jwt/dto/jwt-payload.dto';
import { GoogleAuthDataService } from './google-auth-data.service';
import { ClusterReadService } from '../../cluster/read/cluster-read.service';
import { ClusterWriteService } from '../../cluster/write/cluster-write.service';
import { LogdashLogger } from '../../shared/logdash/aggregate-logger';
import { AUTH_LOGGER } from '../../shared/logdash/logdash-tokens';
import { ClusterRole } from '../../cluster/core/enums/cluster-role.enum';

@Injectable()
export class GoogleAuthClaimService {
  constructor(
    private readonly jwtService: CustomJwtService,
    private readonly userReadService: UserReadService,
    private readonly userWriteService: UserWriteService,
    private readonly emitter: AuthEventEmitter,
    @Inject(AUTH_LOGGER) private readonly logger: LogdashLogger,
    private readonly projectLimitService: ProjectLimitService,
    private readonly authGoogleDataService: GoogleAuthDataService,
    private readonly clusterReadService: ClusterReadService,
    private readonly clusterWriteService: ClusterWriteService,
  ) {}

  public async claimAccount(dto: GoogleClaimProjectBody): Promise<TokenResponse> {
    this.logger.log(`Claiming account`, { accessToken: dto.accessToken });

    const googleAccessToken = await this.authGoogleDataService.getAccessToken(
      dto.googleCode,
      dto.forceLocalLogin,
    );

    const { email, avatar } =
      await this.authGoogleDataService.getGoogleEmailAndAvatar(googleAccessToken);

    this.logger.log(`Got user email and avatar`, { email, avatar });

    const tokenPayload = await this.jwtService.getTokenPayload(dto.accessToken);

    if (!tokenPayload) {
      this.logger.error('Invalid access token');
      throw new UnauthorizedException('Invalid access token');
    }

    const userId = tokenPayload.id;

    const userWithThisEmail = await this.userReadService.readByEmail(email);

    const existingTempUserById = await this.userReadService.readByIdOrThrow(userId);

    if (userWithThisEmail) {
      return this.claimExistingUser(existingTempUserById.id, userWithThisEmail.id);
    } else {
      return this.claimNewUser({
        avatar,
        email,
        emailAccepted: dto.emailAccepted,
        existingTempUserById,
        tokenPayload,
        userId,
      });
    }
  }

  private async claimExistingUser(
    tempUserId: string,
    existingUserId: string,
  ): Promise<TokenResponse> {
    this.logger.log(`Handling existing user`, { tempUserId, existingUserId });

    if (tempUserId === existingUserId) {
      this.logger.log(`User was already logged in. Skipping projects ownership propagation logic`);
      return {
        token: await this.jwtService.sign({ id: existingUserId }),
      };
    }

    const isWithinLimit =
      await this.projectLimitService.newProjectWouldBeWithinLimit(existingUserId);

    if (!isWithinLimit) {
      this.logger.error(`User has reached the project limit`, {
        userId: existingUserId,
      });
      throw new ConflictException('User has reached the project limit');
    }

    const affectedClusters = await this.clusterReadService.readByCreatorId(tempUserId);

    for (const cluster of affectedClusters) {
      await this.clusterWriteService.update({
        id: cluster.id,
        creatorId: existingUserId,
        roles: { [existingUserId]: ClusterRole.Creator },
      });
    }

    await this.userWriteService.delete(tempUserId);

    return {
      token: await this.jwtService.sign({ id: existingUserId }),
    };
  }

  private async claimNewUser(dto: {
    email: string;
    userId: string;
    existingTempUserById: UserNormalized;
    emailAccepted?: boolean;
    tokenPayload: JwtPayloadDto;
    avatar: string;
  }): Promise<TokenResponse> {
    this.logger.log('New user just joined', { email: dto.email });

    if (dto.existingTempUserById.accountClaimStatus === AccountClaimStatus.Claimed) {
      throw new BadRequestException('User already claimed');
    }

    await this.emitter.emitUserRegisteredEvent({
      userId: dto.userId,
      email: dto.email,
      authMethod: AuthMethod.Google,
      emailAccepted: dto.emailAccepted || false,
    });

    await this.userWriteService.update({
      id: dto.tokenPayload.id,
      accountClaimStatus: AccountClaimStatus.Claimed,
      authMethod: AuthMethod.Google,
      email: dto.email,
      avatarUrl: dto.avatar,
      marketingConsent: dto.emailAccepted || false,
    });

    return {
      token: await this.jwtService.sign({ id: dto.userId }),
    };
  }
}
