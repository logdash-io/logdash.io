import { Injectable, UnauthorizedException } from '@nestjs/common';
import { getEnvConfig } from '../../shared/configs/env-configs';
import { getOurEnv, OurEnv } from '../../shared/types/our-env.enum';
import { isRecord } from '../../shared/utils/is-record';

@Injectable()
export class GithubAuthDataService {
  public async getAccessToken(code: string): Promise<string> {
    const { clientId, clientSecret } = this.getGithubClientCredentials();

    const response = await fetch(`https://github.com/login/oauth/access_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    const data = new URLSearchParams(await response.text());
    const error = data.get('error');

    if (!response.ok || error) {
      throw new UnauthorizedException(
        `Github code exchange failed: ${error || `status ${response.status}`}`,
      );
    }

    const token = data.get('access_token');

    if (!token) {
      throw new UnauthorizedException('Github code exchange did not return an access token');
    }

    return token;
  }

  public async getGithubEmail(accessToken: string): Promise<string> {
    const response = await fetch(`https://api.github.com/user/emails`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new UnauthorizedException('Could not read emails from github');
    }

    const emails: unknown = await response.json();

    const primaryEmail: unknown = Array.isArray(emails)
      ? emails.find((email: unknown) => isRecord(email) && email.primary)
      : undefined;

    if (!isRecord(primaryEmail) || !primaryEmail.email || typeof primaryEmail.email !== 'string') {
      throw new UnauthorizedException('Email not found in github response');
    }

    if (primaryEmail.verified !== true) {
      throw new UnauthorizedException('Github primary email is not verified');
    }

    return primaryEmail.email;
  }

  public async getGithubAvatar(accessToken: string): Promise<string | undefined> {
    const response = await fetch(`https://api.github.com/user`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const user: unknown = await response.json();

    return isRecord(user) && typeof user.avatar_url === 'string' ? user.avatar_url : undefined;
  }

  private getGithubClientCredentials(): {
    clientId: string;
    clientSecret: string;
  } {
    // alternative credentials point at the local dev oauth app, never usable in production
    if (getOurEnv() === OurEnv.Local) {
      return {
        clientId: getEnvConfig().github.clientIdAlternative!,
        clientSecret: getEnvConfig().github.clientSecretAlternative!,
      };
    }

    return {
      clientId: getEnvConfig().github.clientId,
      clientSecret: getEnvConfig().github.clientSecret,
    };
  }
}
