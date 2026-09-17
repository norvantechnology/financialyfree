import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BrokerType, LiveTickDto, OptionChainDto } from '@ff/types';
import { IBrokerAdapter, BrokerTokenResult } from './broker.interface';

@Injectable()
export class UpstoxAdapter implements IBrokerAdapter {
  readonly broker: BrokerType = 'upstox';
  private readonly logger = new Logger(UpstoxAdapter.name);

  constructor(private readonly configService: ConfigService) {}

  getAuthUrl(state: string): string {
    const clientId = this.configService.get<string>('UPSTOX_CLIENT_ID') || 'mock_upstox_client_id';
    const redirectUri = this.getRedirectUri();
    return `https://api.upstox.com/v2/login/authorization/dialog?response_type=code&client_id=${encodeURIComponent(
      clientId,
    )}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}`;
  }

  async exchangeToken(code: string): Promise<BrokerTokenResult> {
    const clientId = this.configService.get<string>('UPSTOX_CLIENT_ID') || '';
    const clientSecret = this.configService.get<string>('UPSTOX_CLIENT_SECRET') || '';

    if (!clientId || !clientSecret) {
      this.logger.warn('Upstox credentials not configured. Generating sandbox test token.');
      return {
        accessToken: `upstox_mock_${Date.now()}`,
        clientId: 'UPSTOX_USER_TEST',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        metadata: { broker: 'upstox', mode: 'simulated' },
      };
    }

    const res = await fetch('https://api.upstox.com/v2/login/authorization/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: this.getRedirectUri(),
        grant_type: 'authorization_code',
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Upstox token exchange failed (${res.status}): ${errText}`);
    }

    const data = (await res.json()) as any;
    return {
      accessToken: data?.access_token || '',
      clientId: data?.user_id || '',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      metadata: { user_name: data?.user_name, broker: 'upstox' },
    };
  }

  async getQuotes(tokens: string[], accessToken?: string): Promise<Map<string, LiveTickDto>> {
    const quotes = new Map<string, LiveTickDto>();
    if (!accessToken) return quotes;

    try {
      const query = tokens.join(',');
      const res = await fetch(`https://api.upstox.com/v2/market-quote/quotes?instrument_key=${encodeURIComponent(query)}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(6000),
      });

      if (res.ok) {
        const json = (await res.json()) as any;
        for (const [key, q] of Object.entries<any>(json?.data || {})) {
          quotes.set(key, {
            instrumentToken: q.instrument_token || key,
            symbol: q.symbol || key,
            ltp: q.last_price || 0,
            change: q.net_change || 0,
            changePct: q.percentage_change || 0,
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
      this.logger.error(`Error fetching Upstox quotes: ${e.message}`);
    }

    return quotes;
  }

  async getOptionChain(_symbol: string, _expiry?: string, _accessToken?: string): Promise<OptionChainDto | null> {
    return null;
  }

  getRateLimit() {
    return { requestsPerSecond: 25 }; // Upstox limit is 25 req/sec
  }

  private getRedirectUri(): string {
    const apiUrl = this.configService.get<string>('API_URL') || 'http://localhost:3001';
    return `${apiUrl}/api/v1/options/brokers/upstox/callback`;
  }
}
