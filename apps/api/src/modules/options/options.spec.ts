import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { EncryptionService } from './encryption.service';
import { BrokerAuthService } from './broker-auth.service';
import { MockBrokerAdapter } from './adapters/mock-broker.adapter';
import { ZerodhaAdapter } from './adapters/zerodha.adapter';
import { UpstoxAdapter } from './adapters/upstox.adapter';
import { DhanAdapter } from './adapters/dhan.adapter';
import { AngelOneAdapter } from './adapters/angel.adapter';
import { FyersAdapter } from './adapters/fyers.adapter';
import { BrokerConnectionEntity } from '../../database/entities/broker-connection.entity';
import { DataSourceHealthEntity } from '../../database/entities/data-source-health.entity';
import { OptionsAnalyticsService } from './options-analytics.service';

describe('Options Module: Encryption & Broker OAuth Pipeline', () => {
  let encryptionService: EncryptionService;
  let brokerAuthService: BrokerAuthService;

  const mockBrokerRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn((dto) => ({ ...dto, id: 'conn-1', createdAt: new Date(), updatedAt: new Date() })),
    save: jest.fn((entity) => Promise.resolve({ ...entity, id: entity.id || 'conn-1', createdAt: new Date(), updatedAt: new Date() })),
  };

  const mockHealthRepo = {
    findOne: jest.fn().mockResolvedValue(null),
    create: jest.fn((dto) => ({ ...dto, id: 'h-1' })),
    save: jest.fn((entity) => Promise.resolve(entity)),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'OPTIONS_ENCRYPTION_KEY') return 'test-encryption-key-minimum-32-chars-long!';
      if (key === 'FRONTEND_URL') return 'http://localhost:3000';
      if (key === 'API_URL') return 'http://localhost:3001';
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EncryptionService,
        BrokerAuthService,
        MockBrokerAdapter,
        ZerodhaAdapter,
        UpstoxAdapter,
        DhanAdapter,
        AngelOneAdapter,
        FyersAdapter,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: getRepositoryToken(BrokerConnectionEntity), useValue: mockBrokerRepo },
        { provide: getRepositoryToken(DataSourceHealthEntity), useValue: mockHealthRepo },
      ],
    }).compile();

    encryptionService = module.get<EncryptionService>(EncryptionService);
    brokerAuthService = module.get<BrokerAuthService>(BrokerAuthService);
  });

  describe('AES-256-GCM Encryption Vault', () => {
    it('encrypts and decrypts text accurately with authentication tag verification', () => {
      const sensitiveToken = 'kite_access_token_secret_xyz123!@#$';
      const encrypted = encryptionService.encrypt(sensitiveToken);

      expect(encrypted).not.toEqual(sensitiveToken);
      expect(encrypted.split(':')).toHaveLength(3); // iv:tag:ciphertext

      const decrypted = encryptionService.decrypt(encrypted);
      expect(decrypted).toEqual(sensitiveToken);
    });

    it('rejects tampered ciphertexts and invalid auth tags', () => {
      const encrypted = encryptionService.encrypt('valid_token');
      const parts = encrypted.split(':');
      // Tamper auth tag to corrupt cryptographic MAC
      const tampered = `${parts[0]}:deadbeefdeadbeefdeadbeefdeadbeef:${parts[2]}`;

      expect(() => encryptionService.decrypt(tampered)).toThrow();
    });
  });

  describe('Broker OAuth State & Handshake Flow', () => {
    it('generates encrypted CSRF state and valid OAuth URL for sandbox and real brokers', () => {
      const { authUrl, state } = brokerAuthService.generateAuthUrl('sandbox', 'user-123');

      expect(authUrl).toContain('broker=sandbox');
      expect(authUrl).toContain('state=');
      expect(state).toBeDefined();

      // State decrypts to original user ID
      const decryptedState = encryptionService.decrypt(state);
      expect(decryptedState).toContain('user-123');
    });

    it('completes OAuth code exchange and persists encrypted token in broker_connections', async () => {
      const result = await brokerAuthService.handleOAuthCallback(
        'sandbox',
        'auth_code_test_123',
        undefined,
        'user-123',
      );

      expect(result).toBeDefined();
      expect(result.broker).toBe('sandbox');
      expect(result.status).toBe('connected');
      expect(mockBrokerRepo.save).toHaveBeenCalled();
      expect(mockHealthRepo.save).toHaveBeenCalled();
    });
  });

  describe('Options Analytics Service (IV Smile, GEX, Vol Surface, Sandbox)', () => {
    let analyticsService: OptionsAnalyticsService;

    const mockChain = {
      underlying: 'NIFTY',
      spotPrice: 25000,
      spotChange: 75.5,
      spotChangePct: 0.3,
      timestamp: new Date().toISOString(),
      expiryDates: ['2026-09-24', '2026-10-01', '2026-10-29'],
      selectedExpiry: '2026-09-24',
      pcr: 1.15,
      volumePcr: 1.08,
      maxPain: 25000,
      atmStrike: 25000,
      atmIv: 0.145,
      contracts: [
        {
          strike: 24900,
          ce: { ltp: 180, iv: 0.148, delta: 0.65, gamma: 0.0004, theta: -12, vega: 18, oi: 25000, oiChange: 1500, volume: 50000, buildup: 'Long Buildup' },
          pe: { ltp: 60, iv: 0.152, delta: -0.35, gamma: 0.0004, theta: -8, vega: 16, oi: 45000, oiChange: 3500, volume: 70000, buildup: 'Short Buildup' },
        },
        {
          strike: 25000,
          ce: { ltp: 120, iv: 0.145, delta: 0.51, gamma: 0.0005, theta: -14, vega: 20, oi: 60000, oiChange: 5000, volume: 120000, buildup: 'Long Buildup' },
          pe: { ltp: 110, iv: 0.146, delta: -0.49, gamma: 0.0005, theta: -14, vega: 20, oi: 65000, oiChange: 6000, volume: 130000, buildup: 'Short Buildup' },
        },
        {
          strike: 25100,
          ce: { ltp: 70, iv: 0.142, delta: 0.36, gamma: 0.0004, theta: -10, vega: 17, oi: 48000, oiChange: 4200, volume: 85000, buildup: 'Short Buildup' },
          pe: { ltp: 175, iv: 0.149, delta: -0.64, gamma: 0.0004, theta: -11, vega: 18, oi: 22000, oiChange: 800, volume: 45000, buildup: 'Long Buildup' },
        },
      ],
      source: 'SANDBOX' as const,
    };

    const mockMarketDataService = {
      getOptionChain: jest.fn().mockResolvedValue(mockChain),
    };

    const mockOiSnapshotRepo = {
      find: jest.fn().mockResolvedValue([]),
      create: jest.fn((d) => d),
      save: jest.fn((d) => Promise.resolve(d)),
    };

    const mockSandboxRepo = {
      find: jest.fn().mockResolvedValue([
        {
          id: 'pos-1',
          userId: 'user-123',
          symbol: 'NIFTY',
          strike: 25000,
          optionType: 'CE',
          expiry: '2026-09-24',
          side: 'BUY',
          quantity: 2,
          lotSize: 25,
          entryPrice: 100,
          currentPrice: 120,
          unrealizedPnl: 1000,
          realizedPnl: 0,
          status: 'OPEN',
          entryAt: new Date(),
        },
      ]),
      findOne: jest.fn(),
      save: jest.fn((d) => Promise.resolve(d)),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    const mockStrategyRepo = {
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    beforeEach(() => {
      analyticsService = new OptionsAnalyticsService(
        mockMarketDataService as any,
        mockOiSnapshotRepo as any,
        mockSandboxRepo as any,
        mockStrategyRepo as any,
      );
    });

    it('computes IV smile points with accurate ATM identification', async () => {
      const smile = await analyticsService.getIvSmile('NIFTY');
      expect(smile.underlying).toBe('NIFTY');
      expect(smile.points.length).toBe(3);
      const atmPoint = smile.points.find((p) => p.isAtm);
      expect(atmPoint).toBeDefined();
      expect(atmPoint?.strike).toBe(25000);
      expect(atmPoint?.iv).toBeGreaterThan(0);
    });

    it('computes Vol Surface across multi-expiry contracts', async () => {
      const surface = await analyticsService.getVolSurface('NIFTY');
      expect(surface.surfaces.length).toBeGreaterThan(0);
      expect(surface.surfaces[0].dte).toBeGreaterThan(0);
      expect(surface.surfaces[0].strikes.length).toBe(3);
    });

    it('calculates Gamma Exposure (GEX) metrics and regime', async () => {
      const gex = await analyticsService.getGex('NIFTY');
      expect(gex.spotPrice).toBe(25000);
      expect(gex.totalCallGex).toBeGreaterThan(0);
      expect(gex.totalPutGex).toBeLessThan(0);
      expect(gex.strikes.length).toBe(3);
      expect(['POSITIVE_GAMMA', 'NEGATIVE_GAMMA']).toContain(gex.regime);
    });

    it('manages Sandbox portfolio margins and calculates P&L correctly', async () => {
      const portfolio = await analyticsService.getSandboxPortfolio('user-123');
      expect(portfolio.totalCapital).toBe(1000000);
      expect(portfolio.positions.length).toBe(1);
      // Buy 2 lots (50 qty) entry 100, live 120 -> +1000 unrealized
      expect(portfolio.unrealizedPnl).toBe(1000);
      expect(portfolio.deployedMargin).toBe(5000); // 100 * 50
      expect(portfolio.availableMargin).toBe(995000); // 1000000 - 5000
    });
  });
});
