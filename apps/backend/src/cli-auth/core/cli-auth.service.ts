import { GoneException, HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { getEnvConfig } from '../../shared/configs/env-configs';
import { PersonalApiKeyWriteService } from '../../personal-api-key/write/personal-api-key-write.service';
import { CLI_DEFAULT } from '../../personal-api-key/core/scope-presets';
import { CliAuthStoreService } from './cli-auth-store.service';
import { hashDeviceCode } from './cli-auth.hashing';
import {
  generateDeviceCode,
  generateUserCode,
  normalizeUserCode,
} from './cli-auth.token';
import {
  CLI_AUTH_KEY_TTL_DAYS,
  CLI_AUTH_POLL_INTERVAL_SECONDS,
  CLI_AUTH_TTL_SECONDS,
  CliAuthApproveInput,
  CliAuthPendingRecord,
  CliAuthRequestDetails,
  CliAuthStartInput,
} from './cli-auth.types';

export interface CliAuthStartResult {
  deviceCode: string;
  userCode: string;
  verificationUri: string;
  expiresIn: number;
  interval: number;
}

export type CliAuthPollResult =
  | { status: 'pending' }
  | { status: 'slow_down' }
  | { status: 'denied' }
  | { status: 'expired' }
  | { status: 'approved'; value: string };

export interface CliAuthApproveResult {
  status: 'approved';
  prefix: string;
  expiresAt: string;
}

const VERIFICATION_PATH = '/app/authorize-cli';
const CLIENT_HINT_MAX_LENGTH = 200;

@Injectable()
export class CliAuthService {
  constructor(
    private readonly store: CliAuthStoreService,
    private readonly personalApiKeyWriteService: PersonalApiKeyWriteService,
  ) {}

  public async start(input: CliAuthStartInput): Promise<CliAuthStartResult> {
    const deviceCode = generateDeviceCode();
    const userCode = generateUserCode();
    const deviceCodeHash = hashDeviceCode(deviceCode);

    await this.store.create({
      status: 'pending',
      userId: null,
      keyValue: null,
      userCode,
      deviceCodeHash,
      createdAt: Date.now(),
      clientIp: this.sanitizeClientHint(input.clientIp),
      clientUserAgent: this.sanitizeClientHint(input.clientUserAgent),
    });

    // Deliberately NO `verificationUriComplete`: a link carrying the userCode lets
    // an attacker hand the victim a pre-filled consent page, which turns the "does
    // this match your terminal?" check into a rubber stamp. The human must
    // transcribe the code they can see in their OWN terminal.
    const verificationUri = `${getEnvConfig().app.url}${VERIFICATION_PATH}`;

    return {
      deviceCode,
      userCode,
      verificationUri,
      expiresIn: CLI_AUTH_TTL_SECONDS,
      interval: CLI_AUTH_POLL_INTERVAL_SECONDS,
    };
  }

  /**
   * Session-gated: resolves a user-typed code to the details of the machine that
   * asked, so the consent screen can show something a phished victim would not
   * recognise. Never exposes the deviceCode or any other secret.
   */
  public async lookup(input: {
    userId: string;
    userCode: string;
  }): Promise<CliAuthRequestDetails> {
    const record = await this.resolvePendingRecord(input.userId, input.userCode);

    return {
      userCode: record.userCode,
      clientIp: record.clientIp,
      clientUserAgent: record.clientUserAgent,
      requestedAt: new Date(record.createdAt).toISOString(),
      expiresAt: new Date(record.createdAt + CLI_AUTH_TTL_SECONDS * 1000).toISOString(),
    };
  }

  public async approve(input: CliAuthApproveInput): Promise<CliAuthApproveResult> {
    const record = await this.resolvePendingRecord(input.userId, input.userCode);

    const scopes = input.scopes ?? CLI_DEFAULT;
    // Mandatory expiry: a key minted for a terminal must age out on its own, even
    // if nobody ever visits the revoke screen.
    const expiresAt = new Date(Date.now() + CLI_AUTH_KEY_TTL_DAYS * 24 * 60 * 60 * 1000);

    const { key, value } = await this.personalApiKeyWriteService.create({
      userId: input.userId,
      label: `CLI (${record.userCode})`,
      scopes,
      access: input.access,
      expiresAt,
    });

    record.status = 'approved';
    record.userId = input.userId;
    record.keyValue = value;

    await this.store.update(record);

    return { status: 'approved', prefix: key.prefix, expiresAt: expiresAt.toISOString() };
  }

  public async deny(input: { userId: string; userCode: string }): Promise<{ status: 'denied' }> {
    const record = await this.resolvePendingRecord(input.userId, input.userCode);

    record.status = 'denied';

    await this.store.update(record);

    return { status: 'denied' };
  }

  public async poll(deviceCode: string): Promise<CliAuthPollResult> {
    if (!deviceCode) {
      return { status: 'expired' };
    }

    const deviceCodeHash = hashDeviceCode(deviceCode);
    const record = await this.store.getByDeviceCodeHash(deviceCodeHash);

    // Retrieval is gated SOLELY by deviceCode. A userCode hashed here will not
    // match any device index, so it returns expired — never a value.
    if (!record) {
      return { status: 'expired' };
    }

    if (record.status === 'denied') {
      return { status: 'denied' };
    }

    if (record.status === 'approved' && record.keyValue) {
      // One-time delivery: hand back the value, then destroy the record.
      const value = record.keyValue;
      await this.store.delete(record);

      return { status: 'approved', value };
    }

    // pending — enforce the poll interval.
    const slowDown = await this.store.shouldSlowDown(deviceCodeHash);

    if (slowDown) {
      return { status: 'slow_down' };
    }

    return { status: 'pending' };
  }

  /**
   * Every userCode -> record resolution goes through here, so the brute-force
   * budget is spent on hits and misses alike (ADR-0003 invariant #2).
   */
  private async resolvePendingRecord(
    userId: string,
    rawUserCode: string,
  ): Promise<CliAuthPendingRecord> {
    if (await this.store.exceededLookupBudget(userId)) {
      throw new HttpException('Too many authorization code attempts', 429);
    }

    const userCode = normalizeUserCode(rawUserCode);
    const record = await this.store.getByUserCode(userCode);

    if (!record) {
      // No live record under this userCode — unknown or expired (TTL gone).
      throw new NotFoundException('Authorization request not found or expired');
    }

    if (record.status !== 'pending') {
      // Already approved/denied — cannot re-resolve.
      throw new GoneException('Authorization request already resolved');
    }

    return record;
  }

  /**
   * Client hints are rendered on the consent screen, so cap the length and drop
   * control characters before they ever land in Redis.
   */
  private sanitizeClientHint(value: string | undefined): string {
    return Array.from(value ?? '')
      .filter((char) => char >= ' ' && char !== '\u007f')
      .join('')
      .trim()
      .slice(0, CLIENT_HINT_MAX_LENGTH);
  }
}
