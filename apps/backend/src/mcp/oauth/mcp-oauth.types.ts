import { ScopeEntry } from '../../personal-api-key/core/types/scope-entry.type';

export const MCP_OAUTH_CLIENT_TTL_SECONDS = 30 * 24 * 60 * 60;
export const MCP_OAUTH_CONSENT_TTL_SECONDS = 10 * 60;
export const MCP_OAUTH_CODE_TTL_SECONDS = 2 * 60;
export const MCP_OAUTH_KEY_TTL_DAYS = 30;
export const MCP_OAUTH_AUTHORIZE_PATH = '/app/authorize-mcp';
export const MCP_OAUTH_SCOPES = ['webAnalytics:read', 'webAnalytics:write'] as const;

export interface McpOAuthClient {
  clientId: string;
  clientName: string;
  redirectUris: string[];
  createdAt: number;
}

export interface McpOAuthPendingConsent {
  userId: string;
  clientId: string;
  clientName: string;
  redirectUri: string;
  state: string | null;
  codeChallenge: string;
  scopes: ScopeEntry[];
  scope: string;
  createdAt: number;
}

export interface McpOAuthCode {
  userId: string;
  clientId: string;
  clientName: string;
  redirectUri: string;
  codeChallenge: string;
  scopes: ScopeEntry[];
  scope: string;
  createdAt: number;
}
