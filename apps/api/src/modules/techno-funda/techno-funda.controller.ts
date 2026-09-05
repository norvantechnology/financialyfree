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
  @ApiOperation({ summary: 'Get aggregated dashboard overview (MMI, top PEAD, Vahan)' })
  getOverview() {
    return this.tfService.getOverview();
  }

  @Get('market-mood')
  @UseGuards(JwtAuthGuard, EntitlementGuard)
  @RequireSku('tools_1yr', 'course_lifetime')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get Market Mood Index (0–100) with breadth and historical drift (Requires tools_1yr or course_lifetime)' })
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

  @Get('vahan')
  @UseGuards(JwtAuthGuard, EntitlementGuard)
  @RequireSku('tools_1yr', 'course_lifetime')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get Vahan automotive registration macro trends and OEM shares (Requires tools_1yr or course_lifetime)' })
  getVahanData() {
    return this.tfService.getVahanData();
  }
}
