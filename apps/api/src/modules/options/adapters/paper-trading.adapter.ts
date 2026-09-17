import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BrokerType, LiveTickDto, OptionChainDto } from '@ff/types';
import { IBrokerAdapter, BrokerTokenResult } from './broker.interface';

/**
 * Paper-trading auth only. Does NOT invent option chains, OI, LTP, or IV.
 * Market data always comes from NSE scrape or a real broker adapter.
 */
@Injectable()
export class PaperTradingAdapter implements IBrokerAdapter {
  readonly broker: BrokerType = 'sandbox';
  private readonly logger = new Logger(PaperTradingAdapter.name);

  constructor(private readonly configService: ConfigService) {}

  getAuthUrl(state: string): string {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    return `${frontendUrl}/options-lab?broker=sandbox&oauth_action=authorize&state=${encodeURIComponent(state)}`;
  }

  async exchangeToken(_code: string): Promise<BrokerTokenResult> {
    this.logger.log('[Paper Trading] Enabling paper portfolio (no simulated market feed)');
    return {
      accessToken: `paper_${Buffer.from(Date.now().toString()).toString('base64url')}`,
      refreshToken: undefined,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      clientId: 'PAPER_TRADER',
      metadata: {
        brokerName: 'GoalCompass Paper Trading',
        environment: 'paper',
        simulatedMargin: 1000000,
        marketData: 'none',
      },
    };
  }

  async getQuotes(_tokens: string[]): Promise<Map<string, LiveTickDto>> {
    return new Map();
  }

  async getOptionChain(): Promise<OptionChainDto | null> {
    return null;
  }

  getRateLimit() {
    return { requestsPerSecond: 10 };
  }
}
