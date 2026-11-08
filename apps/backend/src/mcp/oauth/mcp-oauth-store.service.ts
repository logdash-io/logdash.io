import { Injectable } from '@nestjs/common';
import { RedisService } from '../../shared/redis/redis.service';
import {
  MCP_OAUTH_CLIENT_TTL_SECONDS,
  MCP_OAUTH_CODE_TTL_SECONDS,
  MCP_OAUTH_CONSENT_TTL_SECONDS,
  McpOAuthClient,
  McpOAuthCode,
  McpOAuthPendingConsent,
} from './mcp-oauth.types';

const CLIENT_PREFIX = 'mcp-oauth:client:';
const CONSENT_PREFIX = 'mcp-oauth:consent:';
const CODE_PREFIX = 'mcp-oauth:code:';

@Injectable()
export class McpOAuthStoreService {
  constructor(private readonly redis: RedisService) {}

  public async saveClient(client: McpOAuthClient): Promise<void> {
    await this.redis.set(
      `${CLIENT_PREFIX}${client.clientId}`,
      JSON.stringify(client),
      MCP_OAUTH_CLIENT_TTL_SECONDS,
    );
  }

  public async getClient(clientId: string): Promise<McpOAuthClient | null> {
    const raw = await this.redis.get(`${CLIENT_PREFIX}${clientId}`);

    return raw ? (JSON.parse(raw) as McpOAuthClient) : null;
  }

  public async saveConsent(consentId: string, consent: McpOAuthPendingConsent): Promise<void> {
    await this.redis.set(
      `${CONSENT_PREFIX}${consentId}`,
      JSON.stringify(consent),
      MCP_OAUTH_CONSENT_TTL_SECONDS,
    );
  }

  public async getConsent(consentId: string): Promise<McpOAuthPendingConsent | null> {
    const raw = await this.redis.get(`${CONSENT_PREFIX}${consentId}`);

    return raw ? (JSON.parse(raw) as McpOAuthPendingConsent) : null;
  }

  public async deleteConsent(consentId: string): Promise<void> {
    await this.redis.del(`${CONSENT_PREFIX}${consentId}`);
  }

  public async saveCode(codeHash: string, code: McpOAuthCode): Promise<void> {
    await this.redis.set(
      `${CODE_PREFIX}${codeHash}`,
      JSON.stringify(code),
      MCP_OAUTH_CODE_TTL_SECONDS,
    );
  }

  public async takeCode(codeHash: string): Promise<McpOAuthCode | null> {
    const raw = await this.redis.getDel(`${CODE_PREFIX}${codeHash}`);

    return raw ? (JSON.parse(raw) as McpOAuthCode) : null;
  }
}
