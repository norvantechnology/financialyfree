import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  PlanEntity,
  SubscriptionEntity,
  EntitlementEntity,
  PaymentOrderEntity,
  PaymentEntity,
  InvoiceEntity,
} from '../../database/entities/subscription.entity';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { PaymentsModule } from '../payments/payments.module';
import { SystemConfigModule } from '../system-config/system-config.module';

@Module({
  imports: [
    SystemConfigModule,
    TypeOrmModule.forFeature([
      PlanEntity,
      SubscriptionEntity,
      EntitlementEntity,
      PaymentOrderEntity,
      PaymentEntity,
      InvoiceEntity,
    ]),
    PaymentsModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') || 'dev_secret_key_change_in_production_32char',
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
