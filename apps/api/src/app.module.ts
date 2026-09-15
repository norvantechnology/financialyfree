import { Module, Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppThrottlerGuard } from './modules/auth/guards/app-throttler.guard';
import { AppConfigModule } from './config/config.module';
import { getRedisConnectionOptions, isRedisConfigured } from './config/redis.config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { GoalsModule } from './modules/goals/goals.module';
import { KycModule } from './modules/kyc/kyc.module';
import { MutualFundsModule } from './modules/mutual-funds/mutual-funds.module';
import { MfExecutionModule } from './modules/mf-execution/mf-execution.module';
import { LmsModule } from './modules/lms/lms.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { TechnoFundaModule } from './modules/techno-funda/techno-funda.module';
import { WatchlistModule } from './modules/watchlist/watchlist.module';
import { AdminModule } from './modules/admin/admin.module';
import { SystemConfigModule } from './modules/system-config/system-config.module';

const redisReady = isRedisConfigured();
if (!redisReady) {
  new Logger('AppModule').warn(
    'Redis not configured (placeholder or missing REDIS_HOST/REDIS_URL). BullMQ disabled; watchlist uses in-process fallback.',
  );
}

@Module({
  imports: [
    // ── Config ────────────────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    AppConfigModule,

    // ── Database & Queue ──────────────────────────────────────────────
    DatabaseModule,
    ...(redisReady
      ? [
          BullModule.forRoot({
            connection: getRedisConnectionOptions(),
          }),
        ]
      : []),

    // ── Security: Global Throttler / Rate Limiting ────────────────────
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000,
        limit: 120,
      },
    ]),

    // ── Feature Modules ───────────────────────────────────────────────
    AuthModule,
    UsersModule,
    SubscriptionsModule,
    PaymentsModule,
    GoalsModule,
    KycModule,
    MutualFundsModule,
    MfExecutionModule,
    LmsModule,
    NotificationsModule,
    TechnoFundaModule,
    WatchlistModule,
    AdminModule,
    SystemConfigModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AppThrottlerGuard,
    },
  ],
})
export class AppModule {}
