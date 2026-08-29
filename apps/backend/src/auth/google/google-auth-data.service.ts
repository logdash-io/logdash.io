import { Injectable, UnauthorizedException } from '@nestjs/common';
import { getEnvConfig } from '../../shared/configs/env-configs';
import { getOurEnv, OurEnv } from '../../shared/types/our-env.enum';

@Injectable()
export class GoogleAuthDataService {
  public async getAccessToken(code: string): Promise<string> {
    const googleConfig = getEnvConfig().google;
    // alternative credentials point at the local dev oauth app, never usable in production
    const useAlternative = getOurEnv() === OurEnv.Local;

    const response = await fetch('https://www.googleapis.com/oauth2/v4/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: useAlternative
          ? googleConfig.clientIdAlternative!
          : googleConfig.clientId,
        client_secret: useAlternative
          ? googleConfig.clientSecretAlternative!
          : googleConfig.clientSecret,
        code: decodeURIComponent(code),
        grant_type: 'authorization_code',
        redirect_uri: useAlternative
          ? googleConfig.redirectUriAlternative!
          : googleConfig.redirectUri,
      }),
    });

    const data = await response.json();
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
      throw new UnauthorizedException('Could not read user info from google');
    }

    const user = await response.json();

    if (!user.email) {
      throw new UnauthorizedException('Email not found in google response');
    }

    if (user.email_verified !== true) {
      throw new UnauthorizedException('Google email is not verified');
    }

    return { email: user.email, avatar: user.picture };
  }
}
