import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BrokerType, LiveTickDto, OptionChainDto, OptionChainRowDto } from '@ff/types';
import { IBrokerAdapter, BrokerTokenResult } from './broker.interface';

@Injectable()
export class MockBrokerAdapter implements IBrokerAdapter {
  readonly broker: BrokerType = 'sandbox';
  private readonly logger = new Logger(MockBrokerAdapter.name);

  constructor(private readonly configService: ConfigService) {}

  getAuthUrl(state: string): string {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    return `${frontendUrl}/options-lab?broker=sandbox&oauth_action=authorize&state=${encodeURIComponent(state)}`;
  }

  async exchangeToken(code: string): Promise<BrokerTokenResult> {
    this.logger.log(`[Sandbox Broker] Exchanging auth code "${code.substring(0, 8)}..." for test access token`);
    return {
      accessToken: `sandbox_tok_${Buffer.from(Date.now().toString()).toString('base64')}`,
      refreshToken: `sandbox_ref_${Buffer.from(Date.now().toString()).toString('base64')}`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      clientId: 'SANDBOX_TRADER_001',
      metadata: {
        brokerName: 'GoalCompass Sandbox / Paper Trading Environment',
        environment: 'sandbox',
        simulatedMargin: 1000000, // 10 Lakhs INR
      },
    };
  }

  async getQuotes(tokens: string[]): Promise<Map<string, LiveTickDto>> {
    const quotes = new Map<string, LiveTickDto>();
    const now = new Date().toISOString();

    for (const token of tokens) {
      const isIndex = token.includes('NIFTY') || token.includes('SENSEX');
      const baseLtp = isIndex ? (token.includes('BANKNIFTY') ? 52300 : 25150) : 1850;
      const jitter = (Math.random() - 0.48) * 15;
      const ltp = parseFloat((baseLtp + jitter).toFixed(2));

      quotes.set(token, {
        instrumentToken: token,
        symbol: token,
        ltp,
        change: parseFloat(jitter.toFixed(2)),
        changePct: parseFloat(((jitter / baseLtp) * 100).toFixed(2)),
        open: baseLtp - 10,
        high: baseLtp + 35,
        low: baseLtp - 25,
        close: baseLtp,
        volume: Math.floor(150000 + Math.random() * 50000),
        oi: Math.floor(4500000 + Math.random() * 100000),
        oiChange: Math.floor((Math.random() - 0.5) * 80000),
        bidPrice: ltp - 0.05,
        bidQty: 1250,
        askPrice: ltp + 0.05,
        askQty: 1800,
        timestamp: now,
      });
    }

    return quotes;
  }

  async getOptionChain(symbol: string, expiry?: string): Promise<OptionChainDto | null> {
    const isBankNifty = symbol.toUpperCase() === 'BANKNIFTY';
    const isSensex = symbol.toUpperCase() === 'SENSEX';
    const spotPrice = isBankNifty ? 52380.45 : isSensex ? 82400.2 : 25142.15;
    const step = isBankNifty ? 100 : isSensex ? 100 : 50;
    const atmStrike = Math.round(spotPrice / step) * step;

    // Generate 11 strikes around ATM (-5 to +5)
    const strikes: number[] = [];
    for (let i = -5; i <= 5; i++) {
      strikes.push(atmStrike + i * step);
    }

    const contracts: OptionChainRowDto[] = strikes.map((strike) => {
      const moneyness = (strike - spotPrice) / spotPrice;
      const ceIntrinsic = Math.max(0, spotPrice - strike);
      const peIntrinsic = Math.max(0, strike - spotPrice);
      const ceTimeVal = Math.max(15, 140 - Math.abs(moneyness) * 900);
      const peTimeVal = Math.max(15, 135 - Math.abs(moneyness) * 900);

      const ceLtp = parseFloat((ceIntrinsic + ceTimeVal).toFixed(2));
      const peLtp = parseFloat((peIntrinsic + peTimeVal).toFixed(2));
      const ceOi = Math.floor(65000 + (1 - Math.abs(moneyness)) * 85000);
      const peOi = Math.floor(72000 + (1 - Math.abs(moneyness)) * 92000);

      return {
        strike,
        ce: {
          instrumentToken: `CE-${symbol}-${strike}`,
          strike,
          optionType: 'CE',
          ltp: ceLtp,
          change: parseFloat(((Math.random() - 0.45) * 8).toFixed(2)),
          changePct: parseFloat(((Math.random() - 0.45) * 5).toFixed(2)),
          iv: 0.138,
          delta: strike < atmStrike ? 0.72 : strike === atmStrike ? 0.51 : 0.32,
          gamma: 0.0008,
          theta: -18.5,
          vega: 14.2,
          rho: 2.1,
          oi: ceOi,
          oiChange: Math.floor((Math.random() - 0.4) * 12000),
          volume: Math.floor(ceOi * 1.8),
          buildup: ceLtp > ceIntrinsic ? 'Long Buildup' : 'Short Buildup',
        },
        pe: {
          instrumentToken: `PE-${symbol}-${strike}`,
          strike,
          optionType: 'PE',
          ltp: peLtp,
          change: parseFloat(((Math.random() - 0.45) * 8).toFixed(2)),
          changePct: parseFloat(((Math.random() - 0.45) * 5).toFixed(2)),
          iv: 0.142,
          delta: strike > atmStrike ? -0.68 : strike === atmStrike ? -0.49 : -0.28,
          gamma: 0.0008,
          theta: -17.8,
          vega: 14.1,
          rho: -1.9,
          oi: peOi,
          oiChange: Math.floor((Math.random() - 0.4) * 15000),
          volume: Math.floor(peOi * 1.9),
          buildup: peLtp > peIntrinsic ? 'Long Buildup' : 'Short Buildup',
        },
      };
    });

    return {
      underlying: symbol.toUpperCase(),
      spotPrice,
      spotChange: 68.4,
      spotChangePct: 0.27,
      timestamp: new Date().toISOString(),
      expiryDates: ['2026-09-24', '2026-10-01', '2026-10-29'],
      selectedExpiry: expiry || '2026-09-24',
      pcr: 1.15,
      volumePcr: 1.08,
      maxPain: atmStrike,
      atmStrike,
      atmIv: 0.138,
      contracts,
      source: 'SANDBOX',
    };
  }

  getRateLimit() {
    return { requestsPerSecond: 100 };
  }
}
