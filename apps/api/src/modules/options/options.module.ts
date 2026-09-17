import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { BrokerConnectionEntity } from '../../database/entities/broker-connection.entity';
import { InstrumentEntity } from '../../database/entities/instrument.entity';
import { OiSnapshotEntity } from '../../database/entities/oi-snapshot.entity';
import { SavedStrategyEntity } from '../../database/entities/saved-strategy.entity';
import { SandboxPositionEntity } from '../../database/entities/sandbox-position.entity';
import { DataSourceHealthEntity } from '../../database/entities/data-source-health.entity';
import { UserEntity } from '../../database/entities/user.entity';

import { EncryptionService } from './encryption.service';
import { MockBrokerAdapter } from './adapters/mock-broker.adapter';
import { ZerodhaAdapter } from './adapters/zerodha.adapter';
import { UpstoxAdapter } from './adapters/upstox.adapter';
import { DhanAdapter } from './adapters/dhan.adapter';
import { AngelOneAdapter } from './adapters/angel.adapter';
import { FyersAdapter } from './adapters/fyers.adapter';

import { BrokerAuthService } from './broker-auth.service';
import { InstrumentsService } from './instruments.service';
import { MarketDataService } from './market-data.service';
import { OptionsGateway } from './options.gateway';
import { OptionsController } from './options.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BrokerConnectionEntity,
      InstrumentEntity,
      OiSnapshotEntity,
      SavedStrategyEntity,
      SandboxPositionEntity,
      DataSourceHealthEntity,
      UserEntity,
    ]),
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') || 'default-secret',
        signOptions: { expiresIn: '15m' },
      }),
    }),
  ],
  providers: [
    EncryptionService,
    MockBrokerAdapter,
    ZerodhaAdapter,
    UpstoxAdapter,
    DhanAdapter,
    AngelOneAdapter,
    FyersAdapter,
    BrokerAuthService,
    InstrumentsService,
    MarketDataService,
    OptionsGateway,
  ],
  controllers: [OptionsController],
  exports: [
    BrokerAuthService,
    InstrumentsService,
    MarketDataService,
    OptionsGateway,
    EncryptionService,
  ],
})
export class OptionsModule {}
