import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { BrokerType, LiveTickDto, OptionChainDto } from '@ff/types';
import { IBrokerAdapter, BrokerTokenResult } from './broker.interface';

@Injectable()
export class ZerodhaAdapter implements IBrokerAdapter {
  readonly broker: BrokerType = 'zerodha';
  private readonly logger = new Logger(ZerodhaAdapter.name);

  constructor(private readonly configService: ConfigService) {}

  getAuthUrl(state: string): string {
    const apiKey = this.configService.get<string>('ZERODHA_API_KEY') || '';
    if (!apiKey) {
      throw new Error('ZERODHA_API_KEY not configured');
    }
    const redirectUri = this.getRedirectUri();
    return `https://kite.zerodha.com/connect/login?v=3&api_key=${encodeURIComponent(apiKey)}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}`;
  }

  async exchangeToken(requestToken: string): Promise<BrokerTokenResult> {
    const apiKey = this.configService.get<string>('ZERODHA_API_KEY') || '';
    const apiSecret = this.configService.get<string>('ZERODHA_API_SECRET') || '';

    if (!apiKey || !apiSecret) {
      throw new Error('Zerodha credentials not configured. Set ZERODHA_API_KEY and ZERODHA_API_SECRET in .env');
    }

    // Official Kite Connect checksum: SHA-256 of (api_key + request_token + api_secret)
    const checksum = crypto
      .createHash('sha256')
      .update(apiKey + requestToken + apiSecret)
      .digest('hex');

    const res = await fetch('https://api.kite.trade/session/token', {
      method: 'POST',
      headers: {
        'X-Kite-Version': '3',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        api_key: apiKey,
        request_token: requestToken,
        checksum,
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Zerodha token exchange failed (${res.status}): ${errText}`);
    }

    const data = (await res.json()) as any;
    return {
      accessToken: data?.data?.access_token || '',
      clientId: data?.data?.user_id || '',
      expiresAt: new Date(Date.now() + 16 * 60 * 60 * 1000),
      metadata: { user_name: data?.data?.user_name, broker: 'zerodha' },
    };
  }

  async getQuotes(tokens: string[], accessToken?: string): Promise<Map<string, LiveTickDto>> {
    const quotes = new Map<string, LiveTickDto>();
    if (!accessToken) return quotes;

    const apiKey = this.configService.get<string>('ZERODHA_API_KEY') || '';
    const query = tokens.map((t) => `i=${encodeURIComponent(t)}`).join('&');

    try {
      const res = await fetch(`https://api.kite.trade/quote?${query}`, {
        headers: {
          'X-Kite-Version': '3',
          Authorization: `token ${apiKey}:${accessToken}`,
        },
        signal: AbortSignal.timeout(6000),
      });

      if (res.ok) {
        const json = (await res.json()) as any;
        for (const [key, q] of Object.entries<any>(json?.data || {})) {
          quotes.set(key, {
            instrumentToken: String(q.instrument_token || key),
            symbol: key,
            ltp: q.last_price || 0,
            change: q.net_change || 0,
            changePct: q.net_change_percentage || 0,
            open: q.ohlc?.open || 0,
            high: q.ohlc?.high || 0,
            low: q.ohlc?.low || 0,
            close: q.ohlc?.close || 0,
            volume: q.volume || 0,
            oi: q.oi || 0,
            oiChange: 0,
            timestamp: new Date().toISOString(),
          });
        }
      }
    } catch (e: any) {
      this.logger.error(`Error fetching Zerodha quotes: ${e.message}`);
    }

    return quotes;
  }

  async getOptionChain(_symbol: string, _expiry?: string, _accessToken?: string): Promise<OptionChainDto | null> {
    return null; // Kite does not provide a native chain endpoint; constructed via market-data service
  }

  getRateLimit() {
    return { requestsPerSecond: 3 }; // Kite limit is 3 req/sec
  }

  private getRedirectUri(): string {
    const apiUrl = this.configService.get<string>('API_URL') || 'http://localhost:3001';
    return `${apiUrl}/api/v1/options/brokers/zerodha/callback`;
  }
}
