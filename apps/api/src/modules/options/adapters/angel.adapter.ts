import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BrokerType, LiveTickDto, OptionChainDto } from '@ff/types';
import { IBrokerAdapter, BrokerTokenResult } from './broker.interface';

@Injectable()
export class AngelOneAdapter implements IBrokerAdapter {
  readonly broker: BrokerType = 'angelone';

  constructor(private readonly configService: ConfigService) {}

  getAuthUrl(state: string): string {
    const apiKey = this.configService.get<string>('ANGEL_API_KEY') || 'mock_angel_api_key';
    return `https://smartapi.angelbroking.com/publisher-login?api_key=${encodeURIComponent(apiKey)}&state=${encodeURIComponent(state)}`;
  }

  async exchangeToken(code: string): Promise<BrokerTokenResult> {
    return {
      accessToken: `angel_tok_${Date.now()}`,
      clientId: 'ANGEL_MOCK_USER',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      metadata: { broker: 'angelone', codeReceived: code.substring(0, 6) },
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
