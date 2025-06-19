import { BadRequestException, Injectable } from '@nestjs/common';
import { CustomJwtService } from '../custom-jwt/custom-jwt.service';
import { UserReadService } from '../../user/read/user-read.service';
import { UserWriteService } from '../../user/write/user-write.service';
import { AccountClaimStatus } from '../../user/core/enum/account-claim-status.enum';
import { AuthMethod } from '../../user/core/enum/auth-method.enum';
import { AuthEventEmitter } from '../events/auth-event.emitter';
import { GithubLoginBody } from './dto/github-login.body';
import { TokenResponse } from '../../shared/responses/token.response';
import { GithubAuthDataService } from './github-auth-data.service';
import { Logger, Metrics } from '@logdash/js-sdk';
import { AuditLog } from '../../user-audit-log/write/audit-log-write.service';
import { AuditLogUserAction } from '../../user-audit-log/core/enums/audit-log-actions.enum';
import { Actor } from '../../user-audit-log/core/enums/actor.enum';
import { RelatedDomain } from '../../user-audit-log/core/enums/related-domain.enum';

@Injectable()
export class GithubAuthLoginService {
  constructor(
    private readonly jwtService: CustomJwtService,
    private readonly userReadService: UserReadService,
    private readonly userWriteService: UserWriteService,
    private readonly emitter: AuthEventEmitter,
    private readonly logger: Logger,
    private readonly authGithubDataService: GithubAuthDataService,
    private readonly metrics: Metrics,
    private readonly auditLog: AuditLog,
  ) {}

  public async login(dto: GithubLoginBody): Promise<TokenResponse> {
    this.logger.log(`Logging user in...`);

    const accessToken = await this.authGithubDataService.getAccessToken(
      dto.githubCode,
      dto.forceLocalLogin,
    );

    const email = await this.authGithubDataService.getGithubEmail(accessToken);

    if (email.length === 0 || !email) {
      this.logger.error('Email not found in github response');
      throw Error('Email not found in github response');
    }

    const user = await this.userReadService.readByEmail(email);

    this.logger.log(`After reading user by email`, { email, userId: user?.id });

    if (!user && !dto.termsAccepted) {
      this.logger.warn('Cannot create new account without accepting terms');
      throw new BadRequestException('Cannot create new account without accepting terms');
    }

    if (user === null) {
      const avatarUrl = await this.authGithubDataService.getGithubAvatar(accessToken);

      const user = await this.userWriteService.create({
        accountClaimStatus: AccountClaimStatus.Claimed,
        authMethod: AuthMethod.Github,
        email,
        avatarUrl,
        marketingConsent: dto.emailAccepted || false,
      });

      this.logger.log(`Created new user`, { email, userId: user.id });

      await this.emitter.emitUserRegisteredEvent({
        authMethod: AuthMethod.Github,
        email,
        userId: user.id,
        emailAccepted: dto.emailAccepted || false,
      });

      this.metrics.mutate('loginGithub', 1);

      void this.auditLog.create({
        userId: user.id,
        actor: Actor.User,
        action: AuditLogUserAction.GithubLogin,
        relatedDomain: RelatedDomain.User,
        relatedEntityId: user.id,
      });

      return {
        token: await this.jwtService.sign({ id: user.id }),
      };
    }

    this.logger.log(`Logged in existing user`, { email, userId: user.id });

    this.metrics.mutate('loginGithub', 1);

    void this.auditLog.create({
      userId: user.id,
      actor: Actor.User,
      action: AuditLogUserAction.GithubLogin,
      relatedDomain: RelatedDomain.User,
      relatedEntityId: user.id,
    });

    return {
      token: await this.jwtService.sign({ id: user.id }),
    };
  }
}
