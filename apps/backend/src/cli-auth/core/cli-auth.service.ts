import { GoneException, Injectable, NotFoundException } from '@nestjs/common';
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
  CLI_AUTH_POLL_INTERVAL_SECONDS,
  CLI_AUTH_TTL_SECONDS,
  CliAuthApproveInput,
} from './cli-auth.types';

export interface CliAuthStartResult {
  deviceCode: string;
  userCode: string;
  verificationUri: string;
  verificationUriComplete: string;
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
}

const VERIFICATION_PATH = '/app/authorize-cli';

@Injectable()
export class CliAuthService {
  constructor(
    private readonly store: CliAuthStoreService,
    private readonly personalApiKeyWriteService: PersonalApiKeyWriteService,
  ) {}

  public async start(): Promise<CliAuthStartResult> {
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
    });

    const baseUrl = getEnvConfig().app.url;
    const verificationUri = `${baseUrl}${VERIFICATION_PATH}`;
    const verificationUriComplete = `${verificationUri}?user_code=${encodeURIComponent(userCode)}`;

    return {
      deviceCode,
      userCode,
      verificationUri,
      verificationUriComplete,
      expiresIn: CLI_AUTH_TTL_SECONDS,
      interval: CLI_AUTH_POLL_INTERVAL_SECONDS,
    };
  }

  public async approve(input: CliAuthApproveInput): Promise<CliAuthApproveResult> {
    const userCode = normalizeUserCode(input.userCode);
    const record = await this.store.getByUserCode(userCode);

    if (!record) {
      // No live record under this userCode — unknown or expired (TTL gone).
      throw new NotFoundException('Authorization request not found or expired');
    }

    if (record.status !== 'pending') {
      // Already approved/denied — cannot re-approve.
      throw new GoneException('Authorization request already resolved');
    }

    const scopes = input.scopes ?? CLI_DEFAULT;
    const access = input.access ?? { kind: 'all' as const };

    const { key, value } = await this.personalApiKeyWriteService.create({
      userId: input.userId,
      label: `CLI (${userCode})`,
      scopes,
      access,
    });

    record.status = 'approved';
    record.userId = input.userId;
    record.keyValue = value;

    await this.store.update(record);

    return { status: 'approved', prefix: key.prefix };
  }

  public async deny(input: { userId: string; userCode: string }): Promise<{ status: 'denied' }> {
    const userCode = normalizeUserCode(input.userCode);
    const record = await this.store.getByUserCode(userCode);

    if (!record) {
      throw new NotFoundException('Authorization request not found or expired');
    }

    if (record.status === 'approved') {
      throw new GoneException('Authorization request already resolved');
    }

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
}
