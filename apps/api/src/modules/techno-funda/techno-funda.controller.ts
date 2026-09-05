import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TechnoFundaService } from './techno-funda.service';
import { Public } from '../auth/guards/jwt-auth.guard';

@ApiTags('Techno-Funda DIY Toolkit')
@Controller('techno-funda')
export class TechnoFundaController {
  constructor(private readonly tfService: TechnoFundaService) {}

  @Public()
  @Get('overview')
  @ApiOperation({ summary: 'Get aggregated dashboard overview (MMI, top PEAD, Vahan)' })
  getOverview() {
    return this.tfService.getOverview();
  }

  @Public()
  @Get('market-mood')
  @ApiOperation({ summary: 'Get Market Mood Index (0–100) with breadth and historical drift' })
  getMarketMoodIndex() {
    return this.tfService.getMarketMoodIndex();
  }

  @Public()
  @Get('pead')
  @ApiOperation({ summary: 'Get Post-Earnings Announcement Drift (PEAD) screener events' })
  getPeadSurprises() {
    return this.tfService.getPeadSurprises();
  }

  @Public()
  @Get('vahan')
  @ApiOperation({ summary: 'Get Vahan automotive registration macro trends and OEM shares' })
  getVahanData() {
    return this.tfService.getVahanData();
  }
}
