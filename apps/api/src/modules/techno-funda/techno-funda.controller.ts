import { Controller, Get, Query, UseGuards } from '@nestjs/common';
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
  @ApiOperation({ summary: 'Get Market Mood Index (0-100) computed from live India VIX and index breadth' })
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
  getVahanData(@Query('refresh') refresh?: string) {
    return this.tfService.getVahanData(refresh === 'true');
  }

  @Public()
  @Get('buybacks')
  @ApiOperation({ summary: 'Get live corporate actions, demergers, and tender offer events from NSE register' })
  getBuybacks(@Query('refresh') refresh?: string) {
    return this.tfService.getBuybacks(refresh === 'true');
  }

  @Public()
  @Get('results-calendar')
  @ApiOperation({ summary: 'Get live statutory quarterly earnings & corporate board meetings from NSE event calendar' })
  getResultsCalendar(@Query('refresh') refresh?: string) {
    return this.tfService.getResultsCalendar(refresh === 'true');
  }

  @Public()
  @Get('news')
  @ApiOperation({ summary: 'Get live Indian stock market & exchange announcements from Economic Times RSS feed' })
  getNews(@Query('refresh') refresh?: string) {
    return this.tfService.getNewsFeed(refresh === 'true');
  }

  @Public()
  @Get('shareholding')
  @ApiOperation({ summary: 'Get live SEBI Reg 31 promoter & institutional shareholding patterns from NSE master feed' })
  getShareholding(@Query('refresh') refresh?: string) {
    return this.tfService.getShareholding(refresh === 'true');
  }

  @Public()
  @Get('valuation-financials')
  @ApiOperation({ summary: 'Get live listed company financials + Aureus score for any NSE symbol (Screener.in + Yahoo)' })
  getValuationFinancials(@Query('symbol') symbol?: string) {
    return this.tfService.getValuationFinancials(symbol || 'RELIANCE');
  }

  @Public()
  @Get('pead-feed')
  @ApiOperation({ summary: 'Get live Post-Earnings Announcement Drift (PEAD) surprises with drift tracking' })
  getPeadFeed() {
    return this.tfService.getPeadFeed();
  }

  @Public()
  @Get('financial-modelling')
  @ApiOperation({ summary: 'Get forward financial statement modeling and scenario forecasts (Base, Bull, Bear, Management)' })
  getFinancialModelling(
    @Query('symbol') symbol?: string,
    @Query('scenario') scenario?: string,
  ) {
    return this.tfService.getFinancialModelling(symbol, scenario);
  }

  @Public()
  @Get('master-tracker')
  @ApiOperation({ summary: 'Get live curated growth stock watchlist with real-time CMP, 20/100 DMA, and Guidance vs Actuals matrix' })
  getMasterTracker(@Query('refresh') refresh?: string) {
    return this.tfService.getMasterTracker(refresh === 'true');
  }

  @Public()
  @Get('orders')
  @ApiOperation({ summary: 'Get live corporate order wins & contracts from BSE/NSE filings with % of company annual revenue' })
  getOrderTracker(@Query('refresh') refresh?: string) {
    return this.tfService.getOrderTracker(refresh === 'true');
  }

  @Public()
  @Get('bank-nbfc')
  @ApiOperation({ summary: 'Get 12-year historical Cost of Funds (%), Return on Assets (%), and balance sheet deposits across 12 major Indian banks' })
  getBankNbfcData(@Query('refresh') refresh?: string) {
    return this.tfService.getBankNbfcData(refresh === 'true');
  }

  @Public()
  @Get('vahan-makers')
  @ApiOperation({ summary: 'Get Top 50 automobile manufacturers monthly production and YoY growth matrix' })
  getVahanMakers(@Query('refresh') refresh?: string) {
    return this.tfService.getVahanMakersData(refresh === 'true');
  }

  @Public()
  @Get('52w-high-low')
  @ApiOperation({ summary: 'Get daily 52-week high breakout and low breakdown screener from NSE' })
  get52WeekHighLow(@Query('refresh') refresh?: string) {
    return this.tfService.get52WeekHighLow(refresh === 'true');
  }

  @Public()
  @Get('bulk-block-deals')
  @ApiOperation({ summary: 'Get daily NSE/BSE bulk and block deal transactions with marquee investor flags' })
  getBulkBlockDeals(@Query('refresh') refresh?: string) {
    return this.tfService.getBulkBlockDeals(refresh === 'true');
  }

  @Public()
  @Get('fno-oi')
  @ApiOperation({ summary: 'Get F&O open interest, Put-Call Ratio (PCR), max-pain strikes, and rollover data' })
  getFnoOpenInterest(@Query('refresh') refresh?: string) {
    return this.tfService.getFnoOpenInterest(refresh === 'true');
  }

  @Public()
  @Get('insider-trading')
  @ApiOperation({ summary: 'Get SEBI PIT / SAST promoter and insider trading disclosures' })
  getInsiderTrading(@Query('refresh') refresh?: string) {
    return this.tfService.getInsiderTrading(refresh === 'true');
  }

  @Public()
  @Get('ipo-tracker')
  @ApiOperation({ summary: 'Get Mainboard & SME IPO calendar with live bidding subscription multiples' })
  getIpoTracker(@Query('refresh') refresh?: string) {
    return this.tfService.getIpoTracker(refresh === 'true');
  }

  @Public()
  @Get('dividends')
  @ApiOperation({ summary: 'Get standalone dividend ex-dates calendar, yields, bonus issues, and splits' })
  getDividendsCalendar(@Query('refresh') refresh?: string) {
    return this.tfService.getDividendsCalendar(refresh === 'true');
  }

  @Public()
  @Get('sector-heatmap')
  @ApiOperation({ summary: 'Get 11 NSE sectoral indices performance heatmap, rotation state, and breadth' })
  getSectorHeatmap(@Query('refresh') refresh?: string) {
    return this.tfService.getSectorHeatmap(refresh === 'true');
  }

  @Public()
  @Get('delivery-screener')
  @ApiOperation({ summary: 'Get 52-week high momentum stocks with high delivery percentage (>50%)' })
  getDeliveryMomentum(@Query('refresh') refresh?: string) {
    return this.tfService.getDeliveryMomentum(refresh === 'true');
  }

  @Public()
  @Get('circuit-breakers')
  @ApiOperation({ summary: 'Get stocks locked in Upper Circuit and Lower Circuit with pending order volume' })
  getCircuitBreakers(@Query('refresh') refresh?: string) {
    return this.tfService.getCircuitBreakers(refresh === 'true');
  }

  @Public()
  @Get('rbi-macro')
  @ApiOperation({ summary: 'Get RBI Policy Repo Rate history, MPC calendar, CRR/SDF, and inflation metrics' })
  getRbiMacroCalendar(@Query('refresh') refresh?: string) {
    return this.tfService.getRbiMacroCalendar(refresh === 'true');
  }
}


