import { Injectable } from '@nestjs/common';
import { getEnvConfig } from '../../shared/configs/env-configs';

@Injectable()
export class GoogleAuthDataService {
  public async getAccessToken(code: string, forceLocalLogin?: boolean): Promise<string> {
    const googleConfig = getEnvConfig().google;

    const response = await fetch('https://www.googleapis.com/oauth2/v4/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: forceLocalLogin
          ? googleConfig.clientIdAlternative!
          : googleConfig.clientId,
        client_secret: forceLocalLogin
          ? googleConfig.clientSecretAlternative!
          : googleConfig.clientSecret,
        code: decodeURIComponent(code),
        grant_type: 'authorization_code',
        redirect_uri: forceLocalLogin
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
    const user = await response.json();
    return { email: user.email, avatar: user.picture };
  }
}
