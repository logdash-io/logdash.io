import { BadRequestException, Injectable } from '@nestjs/common';
import { CustomJwtService } from '../custom-jwt/custom-jwt.service';
import { UserReadService } from '../../user/read/user-read.service';
import { UserWriteService } from '../../user/write/user-write.service';
import { AccountClaimStatus } from '../../user/core/enum/account-claim-status.enum';
import { AuthMethod } from '../../user/core/enum/auth-method.enum';
import { AuthEventEmitter } from '../events/auth-event.emitter';
import { GoogleLoginBody } from './dto/google-login.body';
import { TokenResponse } from '../../shared/responses/token.response';
import { GoogleAuthDataService } from './google-auth-data.service';
import { Logger, Metrics } from '@logdash/js-sdk';
import { AuditLogUserAction } from '../../audit-log/core/enums/audit-log-actions.enum';
import { Actor } from '../../audit-log/core/enums/actor.enum';
import { RelatedDomain } from '../../audit-log/core/enums/related-domain.enum';
import { AuditLog } from '../../audit-log/creation/audit-log-creation.service';

@Injectable()
export class GoogleAuthLoginService {
  constructor(
    private readonly jwtService: CustomJwtService,
    private readonly userReadService: UserReadService,
    private readonly userWriteService: UserWriteService,
    private readonly emitter: AuthEventEmitter,
    private readonly logger: Logger,
    private readonly authGoogleDataService: GoogleAuthDataService,
    private readonly metrics: Metrics,
    private readonly auditLog: AuditLog,
  ) {}

  public async login(dto: GoogleLoginBody): Promise<TokenResponse> {
    this.logger.log(`Logging user in...`);

    const accessToken = await this.authGoogleDataService.getAccessToken(
      dto.googleCode,
      dto.forceLocalLogin,
    );

    const { email, avatar } = await this.authGoogleDataService.getGoogleEmailAndAvatar(accessToken);

    if (email.length === 0 || !email) {
      this.logger.error('Email not found in google response');
      throw Error('Email not found in google response');
    }

    const user = await this.userReadService.readByEmail(email);

    this.logger.log(`After reading user by email`, { email, userId: user?.id });

    if (!user && !dto.termsAccepted) {
      this.logger.warn('Cannot create new account without accepting terms');
      throw new BadRequestException('Cannot create new account without accepting terms');
    }

    if (user === null) {
      const user = await this.userWriteService.create({
        accountClaimStatus: AccountClaimStatus.Claimed,
        authMethod: AuthMethod.Google,
        email,
        avatarUrl: avatar,
        marketingConsent: dto.emailAccepted || false,
      });

      this.logger.log(`Created new user`, { email, userId: user.id });

      await this.emitter.emitUserRegisteredEvent({
        authMethod: AuthMethod.Google,
        email,
        userId: user.id,
        emailAccepted: dto.emailAccepted || false,
      });

      this.metrics.mutate('loginGoogle', 1);

      this.auditLog.create({
        userId: user.id,
        actor: Actor.User,
        action: AuditLogUserAction.GoogleLogin,
        relatedDomain: RelatedDomain.User,
        relatedEntityId: user.id,
      });

      return {
        token: await this.jwtService.sign({ id: user.id }),
      };
    }

    this.logger.log(`Logged in existing user`, { email, userId: user.id });

    this.metrics.mutate('loginGoogle', 1);

    this.auditLog.create({
      userId: user.id,
      actor: Actor.User,
      action: AuditLogUserAction.GoogleLogin,
      relatedDomain: RelatedDomain.User,
      relatedEntityId: user.id,
    });

    return {
      token: await this.jwtService.sign({ id: user.id }),
    };
  }
}
