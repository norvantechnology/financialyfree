import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { AppConfigModule } from './config/config.module';
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
import { WebinarsModule } from './modules/webinars/webinars.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { TechnoFundaModule } from './modules/techno-funda/techno-funda.module';
import { AdminModule } from './modules/admin/admin.module';

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
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST ?? 'localhost',
        port: parseInt(process.env.REDIS_PORT ?? '6379'),
      },
    }),

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
    WebinarsModule,
    NotificationsModule,
    TechnoFundaModule,
    AdminModule,
  ],
})
export class AppModule {}
