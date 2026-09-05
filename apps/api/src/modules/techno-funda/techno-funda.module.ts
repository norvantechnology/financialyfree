import { Module } from '@nestjs/common';
import { TechnoFundaService } from './techno-funda.service';
import { TechnoFundaController } from './techno-funda.controller';

@Module({
  controllers: [TechnoFundaController],
  providers: [TechnoFundaService],
  exports: [TechnoFundaService],
})
export class TechnoFundaModule {}
