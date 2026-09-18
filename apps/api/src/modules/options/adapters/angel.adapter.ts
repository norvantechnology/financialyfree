import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BrokerType, LiveTickDto, OptionChainDto } from '@ff/types';
import { IBrokerAdapter, BrokerTokenResult } from './broker.interface';

/** Stub until Angel SmartAPI option-chain is wired - fails closed without credentials. */
@Injectable()
export class AngelOneAdapter implements IBrokerAdapter {
  readonly broker: BrokerType = 'angelone';

  constructor(private readonly configService: ConfigService) {}

  getAuthUrl(state: string): string {
    const apiKey = this.configService.get<string>('ANGEL_API_KEY') || '';
    if (!apiKey) {
      throw new Error('ANGEL_API_KEY not configured');
    }
    return `https://smartapi.angelbroking.com/publisher-login?api_key=${encodeURIComponent(apiKey)}&state=${encodeURIComponent(state)}`;
  }

  async exchangeToken(_code: string): Promise<BrokerTokenResult> {
    throw new Error('Angel One OAuth token exchange is not implemented yet. Use Upstox or NSE free feed.');
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
