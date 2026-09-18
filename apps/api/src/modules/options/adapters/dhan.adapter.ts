import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BrokerType, LiveTickDto, OptionChainDto } from '@ff/types';
import { IBrokerAdapter, BrokerTokenResult } from './broker.interface';

/** Stub until Dhan option-chain is wired - fails closed without credentials. */
@Injectable()
export class DhanAdapter implements IBrokerAdapter {
  readonly broker: BrokerType = 'dhan';

  constructor(private readonly configService: ConfigService) {}

  getAuthUrl(state: string): string {
    const clientId = this.configService.get<string>('DHAN_CLIENT_ID') || '';
    if (!clientId) {
      throw new Error('DHAN_CLIENT_ID not configured');
    }
    return `https://auth.dhan.co/login?client_id=${encodeURIComponent(clientId)}&state=${encodeURIComponent(state)}`;
  }

  async exchangeToken(_code: string): Promise<BrokerTokenResult> {
    throw new Error('Dhan OAuth token exchange is not implemented yet. Use Upstox or NSE free feed.');
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
