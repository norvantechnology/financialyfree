import { Module } from '@nestjs/common';
import { TechnoFundaService } from './techno-funda.service';
import { MarketIndexService } from './market-index.service';
import { VahanEtlService } from './vahan-etl.service';
import { TechnoFundaController } from './techno-funda.controller';

@Module({
  controllers: [TechnoFundaController],
  providers: [TechnoFundaService, MarketIndexService, VahanEtlService],
  exports: [TechnoFundaService, MarketIndexService, VahanEtlService],
})
export class TechnoFundaModule {}

