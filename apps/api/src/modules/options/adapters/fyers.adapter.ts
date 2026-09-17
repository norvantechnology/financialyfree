import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BrokerType, LiveTickDto, OptionChainDto } from '@ff/types';
import { IBrokerAdapter, BrokerTokenResult } from './broker.interface';

/** Stub until Fyers option-chain is wired — fails closed without credentials. */
@Injectable()
export class FyersAdapter implements IBrokerAdapter {
  readonly broker: BrokerType = 'fyers';

  constructor(private readonly configService: ConfigService) {}

  getAuthUrl(state: string): string {
    const appId = this.configService.get<string>('FYERS_APP_ID') || '';
    if (!appId) {
      throw new Error('FYERS_APP_ID not configured');
    }
    const redirectUri = this.configService.get<string>('API_URL') || 'http://localhost:3001';
    return `https://api.fyers.in/api/v3/generate-authcode?client_id=${encodeURIComponent(appId)}&redirect_uri=${encodeURIComponent(`${redirectUri}/api/v1/options/brokers/fyers/callback`)}&response_type=code&state=${encodeURIComponent(state)}`;
  }

  async exchangeToken(_code: string): Promise<BrokerTokenResult> {
    throw new Error('Fyers OAuth token exchange is not implemented yet. Use Upstox or NSE free feed.');
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
