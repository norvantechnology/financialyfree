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
import { SavedStrategyEntity } from '../../database/entities/saved-strategy.entity';
import { SandboxPositionEntity } from '../../database/entities/sandbox-position.entity';

@Controller('options')
@UseGuards(JwtAuthGuard)
export class OptionsController {
  constructor(
    private readonly brokerAuthService: BrokerAuthService,
    private readonly marketDataService: MarketDataService,
    private readonly instrumentsService: InstrumentsService,
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

  // ── Sandbox / Paper Trading ─────────────────────────────────────────

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

    // Fetch real live price for execution fill
    const chain = await this.marketDataService.getOptionChain(order.symbol, order.expiry);
    let fillPrice = order.price || 100;

    if (order.strike && order.optionType) {
      const row = chain.contracts.find((c) => c.strike === order.strike);
      if (row) {
        fillPrice = order.optionType === 'CE' ? row.ce.ltp : row.pe.ltp;
      }
    } else {
      fillPrice = chain.spotPrice;
    }

    const position = this.sandboxRepo.create({
      userId,
      symbol: order.symbol.toUpperCase(),
      strike: order.strike || null,
      optionType: order.optionType || 'CE',
      expiry: order.expiry,
      side: order.side,
      quantity: order.quantity,
      lotSize: 25,
      entryPrice: fillPrice,
      currentPrice: fillPrice,
      unrealizedPnl: 0,
      realizedPnl: 0,
      status: 'OPEN',
    });

    const saved = await this.sandboxRepo.save(position);
    return { success: true, message: 'Sandbox order filled at live market price', data: saved };
  }

  @Delete('sandbox/positions/:id')
  async closeSandboxPosition(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.id || req.user?.userId;
    const pos = await this.sandboxRepo.findOne({ where: { id, userId } });
    if (pos) {
      pos.status = 'CLOSED';
      pos.closedAt = new Date();
      pos.realizedPnl = pos.unrealizedPnl;
      await this.sandboxRepo.save(pos);
    }
    return { success: true, message: 'Sandbox position squared off' };
  }
}
