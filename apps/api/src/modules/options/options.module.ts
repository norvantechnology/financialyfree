import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';

import { BrokerConnectionEntity } from '../../database/entities/broker-connection.entity';
import { InstrumentEntity } from '../../database/entities/instrument.entity';
import { OiSnapshotEntity } from '../../database/entities/oi-snapshot.entity';
import { SavedStrategyEntity } from '../../database/entities/saved-strategy.entity';
import { SandboxPositionEntity } from '../../database/entities/sandbox-position.entity';
import { DataSourceHealthEntity } from '../../database/entities/data-source-health.entity';
import { UserEntity } from '../../database/entities/user.entity';

import { EncryptionService } from './encryption.service';
import { PaperTradingAdapter } from './adapters/paper-trading.adapter';
import { ZerodhaAdapter } from './adapters/zerodha.adapter';
import { UpstoxAdapter } from './adapters/upstox.adapter';
import { DhanAdapter } from './adapters/dhan.adapter';
import { AngelOneAdapter } from './adapters/angel.adapter';
import { FyersAdapter } from './adapters/fyers.adapter';

import { BrokerAuthService } from './broker-auth.service';
import { InstrumentsService } from './instruments.service';
import { MarketDataService } from './market-data.service';
import { OptionsAnalyticsService } from './options-analytics.service';
import { OiTrackerProcessor } from './oi-tracker.processor';
import { OptionsGateway } from './options.gateway';
import { OptionsController } from './options.controller';
import { isRedisConfigured } from '../../config/redis.config';

const useBull = isRedisConfigured();

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
    ...(useBull
      ? [
          BullModule.registerQueue({
            name: 'oi-tracker',
          }),
        ]
      : []),
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
    PaperTradingAdapter,
    ZerodhaAdapter,
    UpstoxAdapter,
    DhanAdapter,
    AngelOneAdapter,
    FyersAdapter,
    BrokerAuthService,
    InstrumentsService,
    MarketDataService,
    OptionsAnalyticsService,
    ...(useBull ? [OiTrackerProcessor] : []),
    OptionsGateway,
  ],
  controllers: [OptionsController],
  exports: [
    BrokerAuthService,
    InstrumentsService,
    MarketDataService,
    OptionsAnalyticsService,
    OptionsGateway,
    EncryptionService,
  ],
})
export class OptionsModule {}
