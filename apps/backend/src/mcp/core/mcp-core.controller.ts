import { Body, Controller, Get, Header, HttpCode, Post, Req, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { AllowAnyPersonalKey } from '../../auth/core/decorators/allow-any-personal-key.decorator';
import { Public } from '../../auth/core/decorators/is-public';
import {
  AuthenticatedRequest,
  RequestUser,
} from '../../auth/core/types/authenticated-request.type';
import { McpToolsService } from './mcp-tools.service';

const PROTOCOL_VERSIONS = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05'];

const INSTRUCTIONS =
  'Logdash web analytics for the domains this key reaches. Call describe first to get domain ids, event names and property keys, then read with the other tools. Every count is for the last N days in the plan retention. Write tools change the saved insight cards on the dashboard and need the webAnalytics:write scope.';

type JsonRpcId = string | number | null;

type JsonRpcResponse =
  | { jsonrpc: '2.0'; id: JsonRpcId; result: unknown }
  | { jsonrpc: '2.0'; id: JsonRpcId; error: { code: number; message: string } };

type JsonRpcMessage = {
  jsonrpc?: unknown;
  id?: unknown;
  method?: unknown;
  params?: { protocolVersion?: unknown; name?: unknown; arguments?: unknown };
};

@ApiTags('MCP')
@Controller('mcp')
export class McpCoreController {
  constructor(private readonly tools: McpToolsService) {}

  @Post()
  @HttpCode(200)
  @ApiBearerAuth()
  @AllowAnyPersonalKey()
  @ApiOperation({
    summary: 'Model Context Protocol server over Streamable HTTP, with JSON responses',
  })
  @ApiResponse({ status: 200, description: 'A JSON-RPC response' })
  @ApiResponse({ status: 202, description: 'A notification or response was accepted' })
  public async handle(
    @Body() body: unknown,
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<JsonRpcResponse | undefined> {
    const message = (typeof body === 'object' && body !== null ? body : {}) as JsonRpcMessage;
    const id = typeof message.id === 'string' || typeof message.id === 'number' ? message.id : null;
    if (Array.isArray(body) || message.jsonrpc !== '2.0')
      return this.failure(id, -32600, 'Send one JSON-RPC 2.0 message');
    if (typeof message.method !== 'string') {
      if (message.id === undefined) return this.failure(null, -32600, 'method is required');
      response.status(202);
      return undefined;
    }
    if (message.id === undefined) {
      response.status(202);
      return undefined;
    }
    return this.dispatch(id, message.method, message.params ?? {}, request.user as RequestUser);
  }

  @Public()
  @Get()
  @HttpCode(405)
  @Header('Allow', 'POST')
  @ApiResponse({ status: 405, description: 'This server sends no event stream' })
  public stream(): void {}

  private async dispatch(
    id: JsonRpcId,
    method: string,
    params: NonNullable<JsonRpcMessage['params']>,
    user: RequestUser,
  ): Promise<JsonRpcResponse> {
    if (method === 'initialize') {
      const requested = String(params.protocolVersion);
      return this.success(id, {
        protocolVersion: PROTOCOL_VERSIONS.includes(requested) ? requested : '2025-06-18',
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: 'logdash', title: 'Logdash', version: '1.0.0' },
        instructions: INSTRUCTIONS,
      });
    }
    if (method === 'ping') return this.success(id, {});
    if (method === 'tools/list') return this.success(id, { tools: this.tools.list(user) });
    if (method === 'tools/call') {
      const result =
        typeof params.name === 'string'
          ? await this.tools.call(user, params.name, params.arguments)
          : null;
      return result
        ? this.success(id, result)
        : this.failure(id, -32602, `Unknown tool ${String(params.name)}`);
    }
    return this.failure(id, -32601, `Method ${method} not found`);
  }

  private success(id: JsonRpcId, result: unknown): JsonRpcResponse {
    return { jsonrpc: '2.0', id, result };
  }

  private failure(id: JsonRpcId, code: number, message: string): JsonRpcResponse {
    return { jsonrpc: '2.0', id, error: { code, message } };
  }
}
