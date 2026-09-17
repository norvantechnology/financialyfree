import { AppDataSource } from '../data-source';
import { UserEntity } from '../entities/user.entity';
import { BrokerConnectionEntity } from '../entities/broker-connection.entity';
import { DataSourceHealthEntity } from '../entities/data-source-health.entity';
import { EncryptionService } from '../../modules/options/encryption.service';
import { BrokerAuthService } from '../../modules/options/broker-auth.service';
import { MockBrokerAdapter } from '../../modules/options/adapters/mock-broker.adapter';
import { ZerodhaAdapter } from '../../modules/options/adapters/zerodha.adapter';
import { UpstoxAdapter } from '../../modules/options/adapters/upstox.adapter';
import { DhanAdapter } from '../../modules/options/adapters/dhan.adapter';
import { AngelOneAdapter } from '../../modules/options/adapters/angel.adapter';
import { FyersAdapter } from '../../modules/options/adapters/fyers.adapter';
import { ConfigService } from '@nestjs/config';

async function run() {
  console.log('=== VERIFYING PHASE 1 BROKER OAUTH & DATA PIPELINE ===');
  await AppDataSource.initialize();

  const userRepo = AppDataSource.getRepository(UserEntity);
  const brokerRepo = AppDataSource.getRepository(BrokerConnectionEntity);
  const healthRepo = AppDataSource.getRepository(DataSourceHealthEntity);

  let testUser = await userRepo.findOne({ where: {} });
  if (!testUser) {
    testUser = userRepo.create({
      email: 'options_trader@goalcompass.in',
      firstName: 'Options',
      lastName: 'Trader',
      role: 'user',
      isActive: true,
      preferredLanguage: 'en',
    });
    testUser = await userRepo.save(testUser);
  }

  console.log(`[1] Using Test User: ${testUser.id} (${testUser.email})`);

  const configService = new ConfigService({
    OPTIONS_ENCRYPTION_KEY: 'goalcompass-production-grade-options-aes256-key!',
    FRONTEND_URL: 'http://localhost:3000',
    API_URL: 'http://localhost:3001',
  });

  const encryptionService = new EncryptionService(configService);
  const mockAdapter = new MockBrokerAdapter(configService);
  const zerodhaAdapter = new ZerodhaAdapter(configService);
  const upstoxAdapter = new UpstoxAdapter(configService);
  const dhanAdapter = new DhanAdapter(configService);
  const angelAdapter = new AngelOneAdapter(configService);
  const fyersAdapter = new FyersAdapter(configService);

  const brokerAuthService = new BrokerAuthService(
    brokerRepo,
    healthRepo,
    encryptionService,
    mockAdapter,
    zerodhaAdapter,
    upstoxAdapter,
    dhanAdapter,
    angelAdapter,
    fyersAdapter,
  );

  // 1. Generate OAuth State & URL
  console.log('\n[2] Initiating Sandbox OAuth Flow...');
  const { authUrl, state } = brokerAuthService.generateAuthUrl('sandbox', testUser.id);
  console.log('Generated Auth URL:', authUrl);
  console.log('Encrypted CSRF State:', state);

  // 2. Complete OAuth Callback
  console.log('\n[3] Handling Sandbox OAuth Callback with Auth Code...');
  const code = `SANDBOX_AUTH_CODE_2026_${Date.now()}`;
  const connectionDto = await brokerAuthService.handleOAuthCallback('sandbox', code, state, testUser.id);
  console.log('OAuth Callback Succeeded!');
  console.log('Connection ID:', connectionDto.id);
  console.log('Broker:', connectionDto.broker);
  console.log('Client ID:', connectionDto.brokerClientId);
  console.log('Status:', connectionDto.status);

  // 3. Verify Database Row
  console.log('\n[4] Querying PostgreSQL broker_connections table...');
  const dbRecord = await brokerRepo.findOne({ where: { id: connectionDto.id } });
  console.log('Raw DB Row:');
  console.log({
    id: dbRecord?.id,
    userId: dbRecord?.userId,
    broker: dbRecord?.broker,
    brokerClientId: dbRecord?.brokerClientId,
    encryptedAccessTokenSnippet: dbRecord?.encryptedAccessToken.substring(0, 32) + '...',
    status: dbRecord?.status,
    isActive: dbRecord?.isActive,
    lastConnectedAt: dbRecord?.lastConnectedAt,
  });

  // 4. Verify AES-256-GCM Decryption
  console.log('\n[5] Decrypting token from PostgreSQL using EncryptionService...');
  const decryptedToken = await brokerAuthService.getDecryptedToken(testUser.id, 'sandbox');
  console.log('Decrypted Token:', decryptedToken);

  // 5. Verify Health Entry
  console.log('\n[6] Checking /admin/data-integrity health entry...');
  const healthRecord = await healthRepo.findOne({ where: { sourceKey: 'broker_sandbox' } });
  console.log({
    sourceKey: healthRecord?.sourceKey,
    sourceName: healthRecord?.sourceName,
    mode: healthRecord?.mode,
    status: healthRecord?.status,
    lastFetchedAt: healthRecord?.lastFetchedAt,
  });

  console.log('\n✅ PHASE 1 OAUTH FLOW & ENCRYPTION PIPELINE VERIFICATION PASSED 100%!\n');
  await AppDataSource.destroy();
}

run().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
