import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TechnoFundaService } from './techno-funda.service';
import { Public, JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EntitlementGuard, RequireSku } from '../auth/guards/entitlement.guard';

@ApiTags('Techno-Funda DIY Toolkit')
@Controller('techno-funda')
export class TechnoFundaController {
  constructor(private readonly tfService: TechnoFundaService) {}

  @Public()
  @Get('overview')
  @ApiOperation({ summary: 'Get aggregated dashboard overview (MMI, top PEAD, Vahan, market indices)' })
  getOverview() {
    return this.tfService.getOverview();
  }

  @Public()
  @Get('indices')
  @ApiOperation({ summary: 'Get live/delayed index snapshots (Nifty 50, Sensex, Nifty Bank, India VIX) with Section 58 compliance' })
  getIndices() {
    return this.tfService.getMarketOverview();
  }

  @Public()
  @Get('market-mood')
  @ApiOperation({ summary: 'Get Market Mood Index (0–100) computed from live India VIX and index breadth' })
  getMarketMoodIndex() {
    return this.tfService.getMarketMoodIndex();
  }

  @Get('pead')
  @UseGuards(JwtAuthGuard, EntitlementGuard)
  @RequireSku('tools_1yr', 'course_lifetime')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get Post-Earnings Announcement Drift (PEAD) screener events (Requires tools_1yr or course_lifetime)' })
  getPeadSurprises() {
    return this.tfService.getPeadSurprises();
  }

  @Public()
  @Get('vahan')
  @ApiOperation({ summary: 'Get Vahan automotive registration macro trends, categories and top state counts from Government of India MoRTH portal' })
  getVahanData() {
    return this.tfService.getVahanData();
  }
}

