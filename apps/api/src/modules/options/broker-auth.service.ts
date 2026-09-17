import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { BrokerType, BrokerConnectionDto } from '@ff/types';
import { BrokerConnectionEntity } from '../../database/entities/broker-connection.entity';
import { DataSourceHealthEntity } from '../../database/entities/data-source-health.entity';
import { EncryptionService } from './encryption.service';
import { IBrokerAdapter } from './adapters/broker.interface';
import { PaperTradingAdapter } from './adapters/paper-trading.adapter';
import { ZerodhaAdapter } from './adapters/zerodha.adapter';
import { UpstoxAdapter } from './adapters/upstox.adapter';
import { DhanAdapter } from './adapters/dhan.adapter';
import { AngelOneAdapter } from './adapters/angel.adapter';
import { FyersAdapter } from './adapters/fyers.adapter';

@Injectable()
export class BrokerAuthService {
  private readonly logger = new Logger(BrokerAuthService.name);
  private readonly adapters: Map<BrokerType, IBrokerAdapter> = new Map();

  constructor(
    @InjectRepository(BrokerConnectionEntity)
    private readonly brokerConnRepo: Repository<BrokerConnectionEntity>,
    @InjectRepository(DataSourceHealthEntity)
    private readonly healthRepo: Repository<DataSourceHealthEntity>,
    private readonly encryptionService: EncryptionService,
    private readonly paperAdapter: PaperTradingAdapter,
    private readonly zerodhaAdapter: ZerodhaAdapter,
    private readonly upstoxAdapter: UpstoxAdapter,
    private readonly dhanAdapter: DhanAdapter,
    private readonly angelAdapter: AngelOneAdapter,
    private readonly fyersAdapter: FyersAdapter,
  ) {
    this.adapters.set('sandbox', this.paperAdapter);
    this.adapters.set('zerodha', this.zerodhaAdapter);
    this.adapters.set('upstox', this.upstoxAdapter);
    this.adapters.set('dhan', this.dhanAdapter);
    this.adapters.set('angelone', this.angelAdapter);
    this.adapters.set('fyers', this.fyersAdapter);
  }

  getAdapter(broker: BrokerType): IBrokerAdapter {
    const adapter = this.adapters.get(broker);
    if (!adapter) {
      throw new NotFoundException(`Unsupported broker: ${broker}`);
    }
    return adapter;
  }

  async getAvailableBrokers(userId: string): Promise<Array<{ broker: BrokerType; name: string; isConnected: boolean; status?: string; tokenExpiresAt?: string | null }>> {
    const userConns = await this.brokerConnRepo.find({ where: { userId, isActive: true } });
    const connMap = new Map(userConns.map((c) => [c.broker, c]));

    const brokersList: Array<{ broker: BrokerType; name: string }> = [
      { broker: 'sandbox', name: 'Paper Trading (portfolio only — market data from NSE/broker)' },
      { broker: 'zerodha', name: 'Zerodha (Kite Connect v3)' },
      { broker: 'upstox', name: 'Upstox (v2)' },
      { broker: 'dhan', name: 'Dhan HQ (v2)' },
      { broker: 'angelone', name: 'Angel One (SmartAPI)' },
      { broker: 'fyers', name: 'Fyers (v3)' },
    ];

    return brokersList.map((b) => {
      const conn = connMap.get(b.broker);
      return {
        broker: b.broker,
        name: b.name,
        isConnected: !!conn && conn.status === 'connected',
        status: conn?.status || 'disconnected',
        tokenExpiresAt: conn?.tokenExpiresAt ? conn.tokenExpiresAt.toISOString() : null,
      };
    });
  }

  generateAuthUrl(broker: BrokerType, userId: string): { authUrl: string; state: string } {
    const adapter = this.getAdapter(broker);
    const rawState = `${userId}:${Date.now()}:${crypto.randomBytes(8).toString('hex')}`;
    const state = this.encryptionService.encrypt(rawState);
    const authUrl = adapter.getAuthUrl(state);
    return { authUrl, state };
  }

  async handleOAuthCallback(
    broker: BrokerType,
    code: string,
    state?: string,
    explicitUserId?: string,
  ): Promise<BrokerConnectionDto> {
    let userId = explicitUserId;

    if (state && !userId) {
      try {
        const decrypted = this.encryptionService.decrypt(state);
        const [extractedUserId] = decrypted.split(':');
        if (extractedUserId) userId = extractedUserId;
      } catch (err) {
        this.logger.warn(`Could not decrypt OAuth state: ${err}`);
      }
    }

    if (!userId) {
      throw new BadRequestException('Invalid OAuth session or missing user identification');
    }

    const adapter = this.getAdapter(broker);
    const tokenResult = await adapter.exchangeToken(code);

    const encryptedAccessToken = this.encryptionService.encrypt(tokenResult.accessToken);
    const encryptedRefreshToken = tokenResult.refreshToken
      ? this.encryptionService.encrypt(tokenResult.refreshToken)
      : null;

    let connection = await this.brokerConnRepo.findOne({ where: { userId, broker } });
    if (!connection) {
      connection = this.brokerConnRepo.create({
        userId,
        broker,
      });
    }

    connection.brokerClientId = tokenResult.clientId || '';
    connection.encryptedAccessToken = encryptedAccessToken;
    connection.encryptedRefreshToken = encryptedRefreshToken;
    connection.status = 'connected';
    connection.tokenExpiresAt = tokenResult.expiresAt || new Date(Date.now() + 24 * 3600 * 1000);
    connection.lastConnectedAt = new Date();
    connection.isActive = true;
    connection.metadata = tokenResult.metadata || {};

    const saved = await this.brokerConnRepo.save(connection);

    // Register health in data_source_health table for /admin/data-integrity
    await this.recordBrokerHealth(broker, tokenResult.clientId);

    return {
      id: saved.id,
      userId: saved.userId,
      broker: saved.broker,
      brokerClientId: saved.brokerClientId,
      status: saved.status,
      tokenExpiresAt: saved.tokenExpiresAt ? saved.tokenExpiresAt.toISOString() : null,
      lastConnectedAt: saved.lastConnectedAt ? saved.lastConnectedAt.toISOString() : null,
      isActive: saved.isActive,
      metadata: saved.metadata,
      createdAt: saved.createdAt.toISOString(),
      updatedAt: saved.updatedAt.toISOString(),
    };
  }

  async getDecryptedToken(userId: string, broker: BrokerType): Promise<string | null> {
    const conn = await this.brokerConnRepo.findOne({ where: { userId, broker, isActive: true } });
    if (!conn || !conn.encryptedAccessToken || conn.status !== 'connected') {
      return null;
    }

    try {
      return this.encryptionService.decrypt(conn.encryptedAccessToken);
    } catch (e: any) {
      this.logger.error(`Failed decrypting token for broker ${broker}: ${e.message}`);
      return null;
    }
  }

  /** Active connected brokers for a user (never cross-user). Prefer real brokers before sandbox. */
  async getConnectedBrokers(userId: string): Promise<BrokerType[]> {
    const rows = await this.brokerConnRepo.find({
      where: { userId, isActive: true, status: 'connected' as any },
      order: { lastConnectedAt: 'DESC' },
    });
    const brokers = rows.map((r) => r.broker as BrokerType);
    const real = brokers.filter((b) => b !== 'sandbox');
    const sand = brokers.filter((b) => b === 'sandbox');
    return [...real, ...sand];
  }

  async disconnectBroker(userId: string, broker: BrokerType): Promise<boolean> {
    const conn = await this.brokerConnRepo.findOne({ where: { userId, broker } });
    if (!conn) return false;

    conn.isActive = false;
    conn.status = 'disconnected';
    conn.encryptedAccessToken = '';
    await this.brokerConnRepo.save(conn);
    return true;
  }

  private async recordBrokerHealth(broker: BrokerType, clientId: string) {
    try {
      const sourceKey = `broker_${broker}`;
      let health = await this.healthRepo.findOne({ where: { sourceKey } });
      if (!health) {
        health = this.healthRepo.create({
          sourceKey,
          sourceName: `Options Broker: ${broker.toUpperCase()}`,
        });
      }
      health.mode = 'LIVE_FETCH';
      health.status = 'SUCCESS';
      health.upstreamRef = broker === 'sandbox' ? 'paper-trading' : `https://api.${broker}.com`;
      health.lastFetchedAt = new Date();
      health.durationMs = 0;
      health.rawResponseSnippet = JSON.stringify({
        broker,
        clientId,
        status: 'CONNECTED',
        marketData: broker === 'sandbox' ? 'none' : 'broker',
      });
      health.errorMessage = undefined;
      await this.healthRepo.save(health);
    } catch (err: any) {
      this.logger.warn(`Could not update broker health: ${err.message}`);
    }
  }
}
