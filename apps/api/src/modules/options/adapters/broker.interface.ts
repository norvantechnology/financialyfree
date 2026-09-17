import { BrokerType, LiveTickDto, OptionChainDto } from '@ff/types';

export interface BrokerTokenResult {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date | null;
  clientId: string;
  metadata?: Record<string, any>;
}

export interface IBrokerAdapter {
  readonly broker: BrokerType;
  getAuthUrl(state: string): string;
  exchangeToken(code: string): Promise<BrokerTokenResult>;
  getQuotes(tokens: string[], accessToken?: string): Promise<Map<string, LiveTickDto>>;
  getOptionChain(symbol: string, expiry?: string, accessToken?: string): Promise<OptionChainDto | null>;
  getRateLimit(): { requestsPerSecond: number };
}
