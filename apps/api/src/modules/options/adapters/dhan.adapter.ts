import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BrokerType, LiveTickDto, OptionChainDto } from '@ff/types';
import { IBrokerAdapter, BrokerTokenResult } from './broker.interface';

@Injectable()
export class DhanAdapter implements IBrokerAdapter {
  readonly broker: BrokerType = 'dhan';

  constructor(private readonly configService: ConfigService) {}

  getAuthUrl(state: string): string {
    const clientId = this.configService.get<string>('DHAN_CLIENT_ID') || 'mock_dhan_client';
    return `https://auth.dhan.co/login?client_id=${encodeURIComponent(clientId)}&state=${encodeURIComponent(state)}`;
  }

  async exchangeToken(code: string): Promise<BrokerTokenResult> {
    const clientId = this.configService.get<string>('DHAN_CLIENT_ID') || 'DHAN_MOCK_CLIENT';
    return {
      accessToken: `dhan_tok_${Date.now()}`,
      clientId,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      metadata: { broker: 'dhan', codeReceived: code.substring(0, 6) },
    };
  }

  async getQuotes(_tokens: string[], _accessToken?: string): Promise<Map<string, LiveTickDto>> {
    return new Map();
  }

  async getOptionChain(_symbol: string, _expiry?: string, _accessToken?: string): Promise<OptionChainDto | null> {
    return null;
  }

  getRateLimit() {
    return { requestsPerSecond: 10 };
  }
}
