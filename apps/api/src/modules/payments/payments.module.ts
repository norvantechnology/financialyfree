import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import {
  PaymentOrderEntity,
  PaymentEntity,
  PlanEntity,
} from '../../database/entities/subscription.entity';
import { PaymentsService } from './payments.service';
import { RAZORPAY_PROVIDER } from './providers/razorpay.interface';
import { RazorpayMockProvider } from './providers/razorpay-mock.provider';
import { RazorpayLiveProvider } from './providers/razorpay-live.provider';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PaymentOrderEntity,
      PaymentEntity,
      PlanEntity,
    ]),
  ],
  providers: [
    PaymentsService,
    {
      provide: RAZORPAY_PROVIDER,
      useFactory: (config: ConfigService) => {
        const useMock = config.get<string>('USE_MOCK_PAYMENTS') !== 'false';
        if (useMock) {
          return new RazorpayMockProvider();
        }
        return new RazorpayLiveProvider();
      },
      inject: [ConfigService],
    },
  ],
  exports: [PaymentsService, RAZORPAY_PROVIDER],
})
export class PaymentsModule {}
