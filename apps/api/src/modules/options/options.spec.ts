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
      // Tamper ciphertext
      const tampered = `${parts[0]}:${parts[1]}:${parts[2].slice(0, -2)}ff`;

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
});
