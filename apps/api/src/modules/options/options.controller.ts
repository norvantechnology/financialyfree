import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { BrokerType, OptionType, CreateStrategyDto, SandboxOrderDto } from '@ff/types';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard, Public } from '../auth/guards/jwt-auth.guard';
import { BrokerAuthService } from './broker-auth.service';
import { MarketDataService } from './market-data.service';
import { InstrumentsService } from './instruments.service';
import { OptionsAnalyticsService } from './options-analytics.service';
import { SavedStrategyEntity } from '../../database/entities/saved-strategy.entity';
import { SandboxPositionEntity } from '../../database/entities/sandbox-position.entity';

@Controller('options')
@UseGuards(JwtAuthGuard)
export class OptionsController {
  constructor(
    private readonly brokerAuthService: BrokerAuthService,
    private readonly marketDataService: MarketDataService,
    private readonly instrumentsService: InstrumentsService,
    private readonly analyticsService: OptionsAnalyticsService,
    @InjectRepository(SavedStrategyEntity)
    private readonly strategyRepo: Repository<SavedStrategyEntity>,
    @InjectRepository(SandboxPositionEntity)
    private readonly sandboxRepo: Repository<SandboxPositionEntity>,
  ) {}

  // ── Broker Integration Endpoints ────────────────────────────────────

  @Get('brokers')
  async getBrokers(@Req() req: any) {
    const userId = req.user?.id || req.user?.userId;
    const brokers = await this.brokerAuthService.getAvailableBrokers(userId);
    return { success: true, data: brokers };
  }

  @Get('brokers/:broker/auth-url')
  getAuthUrl(@Param('broker') broker: BrokerType, @Req() req: any) {
    const userId = req.user?.id || req.user?.userId;
    const { authUrl, state } = this.brokerAuthService.generateAuthUrl(broker, userId);
    return { success: true, data: { broker, authUrl, state } };
  }

  @Post('brokers/:broker/callback')
  async handleOAuthCallback(
    @Param('broker') broker: BrokerType,
    @Body() body: { code: string; state?: string },
    @Req() req: any,
  ) {
    const userId = req.user?.id || req.user?.userId;
    const connection = await this.brokerAuthService.handleOAuthCallback(
      broker,
      body.code,
      body.state,
      userId,
    );
    return { success: true, message: `Successfully connected to ${broker}`, data: connection };
  }

  @Delete('brokers/:broker')
  async disconnectBroker(@Param('broker') broker: BrokerType, @Req() req: any) {
    const userId = req.user?.id || req.user?.userId;
    const disconnected = await this.brokerAuthService.disconnectBroker(userId, broker);
    return { success: true, message: `Disconnected from ${broker}`, data: { disconnected } };
  }

  // ── Market Data & Option Chain ──────────────────────────────────────
  // Free Yahoo/NSE path is public. Broker live chain uses JWT userId when present.

  @Public()
  @Get('chain/:underlying')
  async getOptionChain(
    @Param('underlying') underlying: string,
    @Query('expiry') expiry?: string,
    @Query('broker') broker?: BrokerType,
    @Req() req?: any,
  ) {
    const userId = req?.user?.id || req?.user?.userId;
    const chain = await this.marketDataService.getOptionChain(underlying, expiry, userId, broker);
    return { success: true, data: chain };
  }

  @Public()
  @Get('spot/:underlying')
  async getSpotQuote(@Param('underlying') underlying: string) {
    const quote = await this.marketDataService.fetchLiveSpotQuote(underlying);
    return { success: true, data: quote };
  }

  @Public()
  @Get('chart/:underlying')
  async getIntradayChart(
    @Param('underlying') underlying: string,
    @Query('interval') interval?: string,
    @Query('range') range?: string,
  ) {
    const chart = await this.marketDataService.getIntradayCandles(underlying, interval, range);
    return { success: true, data: chart };
  }

  @Public()
  @Get('instruments')
  async searchInstruments(
    @Query('symbol') symbol?: string,
    @Query('expiry') expiry?: string,
    @Query('optionType') optionType?: OptionType,
    @Query('strike') strike?: string,
  ) {
    const instruments = await this.instrumentsService.searchInstruments({
      symbol,
      expiry,
      optionType,
      strike: strike ? Number(strike) : undefined,
    });
    return { success: true, data: instruments };
  }

  @Public()
  @Get('underlyings')
  async getUnderlyings() {
    const underlyings = await this.instrumentsService.getUnderlyingSymbols();
    return { success: true, data: underlyings };
  }

  // ── Strategy Storage ────────────────────────────────────────────────

  @Get('strategies')
  async getStrategies(@Req() req: any) {
    const userId = req.user?.id || req.user?.userId;
    const strategies = await this.strategyRepo.find({
      where: { userId },
      order: { updatedAt: 'DESC' },
    });
    return { success: true, data: strategies };
  }

  @Post('strategies')
  async saveStrategy(@Body() body: CreateStrategyDto, @Req() req: any) {
    const userId = req.user?.id || req.user?.userId;
    const strategy = this.strategyRepo.create({
      userId,
      name: body.name,
      underlying: body.underlying,
      legs: body.legs,
      notes: body.notes,
      tags: body.tags,
    });
    const saved = await this.strategyRepo.save(strategy);
    return { success: true, message: 'Strategy saved successfully', data: saved };
  }

  @Delete('strategies/:id')
  async deleteStrategy(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.id || req.user?.userId;
    const res = await this.analyticsService.deleteStrategy(userId, id);
    return { success: res.success, message: res.success ? 'Strategy deleted' : 'Strategy not found' };
  }

  // ── Advanced Analytics Endpoints ────────────────────────────────────

  @Public()
  @Get('analytics/iv-smile/:underlying')
  async getIvSmile(
    @Param('underlying') underlying: string,
    @Query('expiry') expiry?: string,
  ) {
    const data = await this.analyticsService.getIvSmile(underlying, expiry);
    return { success: true, data };
  }

  @Public()
  @Get('analytics/vol-surface/:underlying')
  async getVolSurface(@Param('underlying') underlying: string) {
    const data = await this.analyticsService.getVolSurface(underlying);
    return { success: true, data };
  }

  @Public()
  @Get('analytics/gex/:underlying')
  async getGex(
    @Param('underlying') underlying: string,
    @Query('expiry') expiry?: string,
  ) {
    const data = await this.analyticsService.getGex(underlying, expiry);
    return { success: true, data };
  }

  @Public()
  @Get('analytics/oi-history/:underlying')
  async getOiHistory(
    @Param('underlying') underlying: string,
    @Query('expiry') expiry?: string,
  ) {
    const data = await this.analyticsService.getOiHistory(underlying, expiry);
    return { success: true, data };
  }

  @Post('analytics/oi-snapshot/:underlying')
  async triggerOiSnapshot(
    @Param('underlying') underlying: string,
    @Query('expiry') expiry?: string,
  ) {
    const count = await this.analyticsService.recordOiSnapshot(underlying, expiry);
    return { success: true, message: `Recorded ${count} snapshot rows` };
  }

  // ── Sandbox / Paper Trading ─────────────────────────────────────────

  @Get('sandbox/portfolio')
  async getSandboxPortfolio(@Req() req: any) {
    const userId = req.user?.id || req.user?.userId;
    const portfolio = await this.analyticsService.getSandboxPortfolio(userId);
    return { success: true, data: portfolio };
  }

  @Get('sandbox/positions')
  async getSandboxPositions(@Req() req: any) {
    const userId = req.user?.id || req.user?.userId;
    const positions = await this.sandboxRepo.find({
      where: { userId, status: 'OPEN' },
      order: { entryAt: 'DESC' },
    });
    return { success: true, data: positions };
  }

  @Post('sandbox/positions')
  async placeSandboxOrder(@Body() order: SandboxOrderDto, @Req() req: any) {
    const userId = req.user?.id || req.user?.userId;

    const chain = await this.marketDataService.getOptionChain(order.symbol, order.expiry, userId);
    let fillPrice: number | null = order.price && order.price > 0 ? order.price : null;

    if (order.strike && order.optionType) {
      const row = chain.contracts.find((c) => c.strike === order.strike);
      if (row) {
        const ltp = order.optionType === 'CE' ? row.ce.ltp : row.pe.ltp;
        if (ltp > 0) fillPrice = ltp;
      }
    } else if (chain.spotPrice > 0) {
      fillPrice = chain.spotPrice;
    }

    if (fillPrice == null || fillPrice <= 0) {
      return {
        success: false,
        message:
          'No live LTP available to fill paper order. Wait for NSE_LIVE/BROKER_LIVE chain or pass an explicit price.',
      };
    }

    const position = this.sandboxRepo.create({
      userId,
      symbol: order.symbol.toUpperCase(),
      strike: order.strike || null,
      optionType: order.optionType || 'CE',
      expiry: order.expiry,
      side: order.side,
      quantity: order.quantity,
      lotSize: chain.lotSize || this.marketDataService.getLotSize(order.symbol),
      entryPrice: fillPrice,
      currentPrice: fillPrice,
      unrealizedPnl: 0,
      realizedPnl: 0,
      status: 'OPEN',
    });

    const saved = await this.sandboxRepo.save(position);
    return { success: true, message: 'Sandbox order filled at live market price', data: saved };
  }

  @Post('sandbox/square-off/:id')
  async squareOffPosition(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.id || req.user?.userId;
    const result = await this.analyticsService.squareOffPosition(userId, id);
    return result;
  }

  @Delete('sandbox/positions/:id')
  async closeSandboxPosition(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.id || req.user?.userId;
    const result = await this.analyticsService.squareOffPosition(userId, id);
    return result;
  }

  @Post('sandbox/square-off-all')
  async squareOffAll(@Req() req: any) {
    const userId = req.user?.id || req.user?.userId;
    const result = await this.analyticsService.squareOffAll(userId);
    return result;
  }

  @Post('sandbox/reset')
  async resetSandbox(@Req() req: any) {
    const userId = req.user?.id || req.user?.userId;
    const result = await this.analyticsService.resetSandbox(userId);
    return result;
  }
}
