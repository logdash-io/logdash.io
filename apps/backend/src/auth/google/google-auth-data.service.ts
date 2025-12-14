import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { getEnvConfig } from '../../shared/configs/env-configs';
import { Logger } from '@logdash/js-sdk';

@Injectable()
export class GoogleAuthDataService {
  constructor(private readonly logger: Logger) {}

  public async getAccessToken(code: string, forceLocalLogin?: boolean): Promise<string> {
    const response = await fetch('https://www.googleapis.com/oauth2/v4/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: getEnvConfig().google.clientId,
        client_secret: getEnvConfig().google.clientSecret,
        code: decodeURIComponent(code),
        grant_type: 'authorization_code',
        redirect_uri: forceLocalLogin
          ? getEnvConfig().google.redirectUriAlternative!
          : getEnvConfig().google.redirectUri,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.access_token) {
      this.logger.error('Failed to get access token from Google', {
        status: response.status,
        error: data.error,
        errorDescription: data.error_description,
      });
      throw new InternalServerErrorException(
        `Failed to authenticate with Google: ${data.error_description || data.error || 'Unknown error'}`,
      );
    }

    return data.access_token;
  }

  public async getGoogleEmailAndAvatar(
    accessToken: string,
  ): Promise<{ email: string; avatar: string }> {
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      this.logger.error('Failed to get user info from Google', {
        status: response.status,
      });
      throw new InternalServerErrorException('Failed to get user information from Google');
    }

    const user = await response.json();

    if (!user.email) {
      this.logger.error('Email not found in Google response', { user });
      throw new InternalServerErrorException('Email not found in Google response');
    }

    return { email: user.email, avatar: user.picture };
  }
}
