import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSourceHealthEntity } from '../../database/entities/data-source-health.entity';
import { TechnoFundaService } from './techno-funda.service';
import { MarketIndexService } from './market-index.service';
import { VahanEtlService } from './vahan-etl.service';
import { TechnoFundaController } from './techno-funda.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DataSourceHealthEntity])],
  controllers: [TechnoFundaController],
  providers: [TechnoFundaService, MarketIndexService, VahanEtlService],
  exports: [TechnoFundaService, MarketIndexService, VahanEtlService],
})
export class TechnoFundaModule {}

