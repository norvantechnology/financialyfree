import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import {
  MfSchemeEntity,
  MfOrderEntity,
  MfFolioEntity,
} from '../../database/entities/mf.entity';
import { KycEntity } from '../../database/entities/kyc.entity';
import { MfExecutionService } from './mf-execution.service';
import { MfExecutionController } from './mf-execution.controller';
import { BSE_STAR_MF_PROVIDER } from './providers/bse-star-mf.interface';
import { BseStarMfMockProvider } from './providers/bse-star-mf-mock.provider';
import { BseStarMfLiveProvider } from './providers/bse-star-mf-live.provider';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MfSchemeEntity,
      MfOrderEntity,
      MfFolioEntity,
      KycEntity,
    ]),
  ],
  controllers: [MfExecutionController],
  providers: [
    MfExecutionService,
    {
      provide: BSE_STAR_MF_PROVIDER,
      useFactory: (config: ConfigService) => {
        const useMock = config.get<string>('USE_MOCK_MF_EXECUTION') !== 'false';
        if (useMock) {
          return new BseStarMfMockProvider();
        }
        return new BseStarMfLiveProvider();
      },
      inject: [ConfigService],
    },
  ],
  exports: [MfExecutionService, BSE_STAR_MF_PROVIDER],
})
export class MfExecutionModule {}
