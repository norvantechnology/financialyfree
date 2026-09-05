import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KycEntity } from '../../database/entities/kyc.entity';
import { KycService } from './kyc.service';
import { KycController } from './kyc.controller';
import { KYC_PROVIDER } from './providers/kyc.interface';
import { KycMockProvider } from './providers/kyc-mock.provider';
import { MfExecutionModule } from '../mf-execution/mf-execution.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([KycEntity]),
    MfExecutionModule,
  ],
  controllers: [KycController],
  providers: [
    KycService,
    {
      provide: KYC_PROVIDER,
      useClass: KycMockProvider,
    },
  ],
  exports: [KycService, KYC_PROVIDER],
})
export class KycModule {}
