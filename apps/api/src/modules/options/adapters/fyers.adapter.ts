import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BrokerType, LiveTickDto, OptionChainDto } from '@ff/types';
import { IBrokerAdapter, BrokerTokenResult } from './broker.interface';

@Injectable()
export class FyersAdapter implements IBrokerAdapter {
  readonly broker: BrokerType = 'fyers';

  constructor(private readonly configService: ConfigService) {}

  getAuthUrl(state: string): string {
    const appId = this.configService.get<string>('FYERS_APP_ID') || 'mock_fyers_app_id';
    return `https://api.fyers.in/api/v3/generate-authcode?client_id=${encodeURIComponent(appId)}&redirect_uri=mock&response_type=code&state=${encodeURIComponent(state)}`;
  }

  async exchangeToken(code: string): Promise<BrokerTokenResult> {
    return {
      accessToken: `fyers_tok_${Date.now()}`,
      clientId: 'FYERS_MOCK_USER',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      metadata: { broker: 'fyers', codeReceived: code.substring(0, 6) },
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
