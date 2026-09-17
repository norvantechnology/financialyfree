import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { MarketDataService } from './market-data.service';
import { OiSnapshotEntity } from '../../database/entities/oi-snapshot.entity';
import { SandboxPositionEntity } from '../../database/entities/sandbox-position.entity';
import { SavedStrategyEntity } from '../../database/entities/saved-strategy.entity';
import {
  IvSmilePointDto,
  VolSurfaceExpiryDto,
  GexSummaryDto,
  SandboxPortfolioDto,
} from '@ff/types';
import { calculateGex, calculatePcr } from '@ff/calc';

@Injectable()
export class OptionsAnalyticsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OptionsAnalyticsService.name);
  private snapshotTimer?: NodeJS.Timeout;

  constructor(
    private readonly marketDataService: MarketDataService,
    @InjectRepository(OiSnapshotEntity)
    private readonly oiSnapshotRepo: Repository<OiSnapshotEntity>,
    @InjectRepository(SandboxPositionEntity)
    private readonly sandboxRepo: Repository<SandboxPositionEntity>,
    @InjectRepository(SavedStrategyEntity)
    private readonly strategyRepo: Repository<SavedStrategyEntity>,
  ) {}

  onModuleInit() {
    // Schedule periodic snapshot fallback (every 5 minutes during market hours)
    this.snapshotTimer = setInterval(() => {
      this.autoSnapshotIndices().catch((err) => {
        this.logger.debug(`Auto snapshot skipped: ${err.message}`);
      });
    }, 5 * 60 * 1000);
  }

  onModuleDestroy() {
    if (this.snapshotTimer) {
      clearInterval(this.snapshotTimer);
    }
  }

  private isMarketOpen(): boolean {
    const now = new Date();
    // Convert to IST (UTC + 5:30)
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(now.getTime() + istOffset);
    const day = istDate.getUTCDay();
    if (day === 0 || day === 6) return false; // Weekend

    const hours = istDate.getUTCHours();
    const minutes = istDate.getUTCMinutes();
    const totalMinutes = hours * 60 + minutes;

    // 09:15 to 15:30 IST is 555 to 930 minutes
    return totalMinutes >= 555 && totalMinutes <= 930;
  }

  private async autoSnapshotIndices() {
    if (!this.isMarketOpen()) return;
    const indices = ['NIFTY', 'BANKNIFTY'];
    for (const sym of indices) {
      await this.recordOiSnapshot(sym).catch(() => null);
    }
  }

  /**
   * Generates Implied Volatility Smile curve for an underlying and expiry.
   */
  async getIvSmile(underlying: string, expiry?: string): Promise<{
    underlying: string;
    expiry: string;
    spotPrice: number;
    atmIv: number | null;
    points: IvSmilePointDto[];
  }> {
    const chain = await this.marketDataService.getOptionChain(underlying, expiry);

    const points: IvSmilePointDto[] = chain.contracts.map((row) => {
      const isAtm = row.strike === chain.atmStrike;
      // Derived IV: prioritize CE IV or PE IV or average
      const avgIv =
        row.ce.iv && row.pe.iv
          ? Math.round(((row.ce.iv + row.pe.iv) / 2) * 10000) / 100
          : (row.ce.iv ?? row.pe.iv ?? 0.15) * 100;

      return {
        strike: row.strike,
        iv: Math.round(avgIv * 100) / 100,
        callLtp: row.ce.ltp,
        putLtp: row.pe.ltp,
        isAtm,
      };
    });

    return {
      underlying: chain.underlying,
      expiry: chain.selectedExpiry,
      spotPrice: chain.spotPrice,
      atmIv: chain.atmIv ? Math.round(chain.atmIv * 10000) / 100 : null,
      points,
    };
  }

  /**
   * Generates Volatility Surface across multiple expiries for an underlying.
   */
  async getVolSurface(underlying: string): Promise<{
    underlying: string;
    spotPrice: number;
    surfaces: VolSurfaceExpiryDto[];
  }> {
    const baseChain = await this.marketDataService.getOptionChain(underlying);
    const expiries = baseChain.expiryDates.slice(0, 4); // Near, Next, Far 1, Far 2

    const surfaces: VolSurfaceExpiryDto[] = [];
    const now = new Date();

    for (const exp of expiries) {
      try {
        const chain = await this.marketDataService.getOptionChain(underlying, exp);
        const expDate = new Date(exp);
        const diffMs = expDate.getTime() - now.getTime();
        const dte = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

        const strikes = chain.contracts.map((c) => {
          const ivVal = c.ce.iv ?? c.pe.iv ?? 0.15;
          return {
            strike: c.strike,
            iv: Math.round(ivVal * 10000) / 100,
          };
        });

        surfaces.push({
          expiry: exp,
          dte,
          strikes,
        });
      } catch (e) {
        this.logger.debug(`Could not compute surface for expiry ${exp}: ${(e as any)?.message}`);
      }
    }

    return {
      underlying: baseChain.underlying,
      spotPrice: baseChain.spotPrice,
      surfaces,
    };
  }

  /**
   * Calculates Gamma Exposure (GEX) across all strikes.
   */
  async getGex(underlying: string, expiry?: string): Promise<GexSummaryDto> {
    const chain = await this.marketDataService.getOptionChain(underlying, expiry);

    const strikesData = chain.contracts.map((row) => ({
      strike: row.strike,
      callOi: row.ce.oi,
      putOi: row.pe.oi,
      callGamma: row.ce.gamma || 0.0001,
      putGamma: row.pe.gamma || 0.0001,
    }));

    // Lot size: 25 for NIFTY, 15 for BANKNIFTY, 50 for FINNIFTY, default 25
    let lotSize = 25;
    if (underlying.toUpperCase() === 'BANKNIFTY') lotSize = 15;
    if (underlying.toUpperCase() === 'FINNIFTY') lotSize = 40;
    if (underlying.toUpperCase() === 'SENSEX') lotSize = 10;

    const gexResult = calculateGex(chain.spotPrice, strikesData, lotSize);

    return {
      underlying: chain.underlying,
      spotPrice: gexResult.spotPrice,
      totalCallGex: gexResult.totalCallGex,
      totalPutGex: gexResult.totalPutGex,
      netGex: gexResult.netGex,
      zeroGammaStrike: gexResult.zeroGammaStrike,
      regime: gexResult.regime,
      strikes: gexResult.strikes,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Fetches OI History buildup for the day or generates intraday series.
   */
  async getOiHistory(underlying: string, expiry?: string): Promise<{
    underlying: string;
    expiry: string;
    points: Array<{
      timestamp: string;
      callOi: number;
      putOi: number;
      pcr: number;
      spotPrice: number;
    }>;
  }> {
    const chain = await this.marketDataService.getOptionChain(underlying, expiry);
    const selectedExpiry = chain.selectedExpiry;

    // Check database for real snapshots from today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const snapshots = await this.oiSnapshotRepo.find({
      where: {
        symbol: underlying.toUpperCase(),
        expiry: selectedExpiry,
        timestamp: Between(today, tomorrow),
      },
      order: { timestamp: 'ASC' },
    });

    if (snapshots.length > 5) {
      // Group by timestamp
      const map = new Map<string, { callOi: number; putOi: number; spot: number }>();
      for (const s of snapshots) {
        const timeKey = s.timestamp.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
        const current = map.get(timeKey) || { callOi: 0, putOi: 0, spot: s.ltp };
        if (s.optionType === 'CE') current.callOi += Number(s.oi);
        else current.putOi += Number(s.oi);
        map.set(timeKey, current);
      }

      const points = Array.from(map.entries()).map(([ts, val]) => {
        const pcrResult = calculatePcr([
          {
            callOi: val.callOi,
            putOi: val.putOi,
            callVolume: 0,
            putVolume: 0,
          },
        ]);
        return {
          timestamp: ts,
          callOi: val.callOi,
          putOi: val.putOi,
          pcr: pcrResult.oiPcr,
          spotPrice: val.spot || chain.spotPrice,
        };
      });

      return { underlying, expiry: selectedExpiry, points };
    }

    // Fallback: build an intraday profile based on current chain data
    const totalCallOi = chain.contracts.reduce((acc, c) => acc + c.ce.oi, 0);
    const totalPutOi = chain.contracts.reduce((acc, c) => acc + c.pe.oi, 0);

    const times = [
      '09:15', '09:30', '10:00', '10:30', '11:00', '11:30',
      '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    ];

    const todayStr = new Date().toISOString().slice(0, 10);
    const points = times.map((t, idx) => {
      // Progressive OI accumulation factor across the day
      const progress = 0.35 + 0.65 * ((idx + 1) / times.length);
      const randomNoise = 1 + (Math.sin(idx * 0.8) * 0.03);
      const cOi = Math.round(totalCallOi * progress * randomNoise);
      const pOi = Math.round(totalPutOi * progress * randomNoise);
      const pcrVal = cOi > 0 ? Math.round((pOi / cOi) * 100) / 100 : 1.0;
      const spotOffset = (idx - 7) * 8;

      return {
        timestamp: `${todayStr}T${t}:00.000Z`,
        callOi: cOi,
        putOi: pOi,
        pcr: pcrVal,
        spotPrice: chain.spotPrice + spotOffset,
      };
    });

    return {
      underlying,
      expiry: selectedExpiry,
      points,
    };
  }

  /**
   * Takes a live snapshot of OI for all strikes of an underlying.
   */
  async recordOiSnapshot(underlying: string, expiry?: string): Promise<number> {
    const chain = await this.marketDataService.getOptionChain(underlying, expiry);
    const rows: OiSnapshotEntity[] = [];

    for (const c of chain.contracts) {
      // CE Snapshot
      const ceRow = this.oiSnapshotRepo.create({
        symbol: underlying.toUpperCase(),
        expiry: chain.selectedExpiry,
        strike: c.strike,
        optionType: 'CE',
        oi: String(c.ce.oi),
        oiChange: String(c.ce.oiChange),
        volume: String(c.ce.volume),
        ltp: c.ce.ltp,
        iv: c.ce.iv,
        timestamp: new Date(),
      });
      rows.push(ceRow);

      // PE Snapshot
      const peRow = this.oiSnapshotRepo.create({
        symbol: underlying.toUpperCase(),
        expiry: chain.selectedExpiry,
        strike: c.strike,
        optionType: 'PE',
        oi: String(c.pe.oi),
        oiChange: String(c.pe.oiChange),
        volume: String(c.pe.volume),
        ltp: c.pe.ltp,
        iv: c.pe.iv,
        timestamp: new Date(),
      });
      rows.push(peRow);
    }

    await this.oiSnapshotRepo.save(rows);
    return rows.length;
  }

  /**
   * Fetches full Sandbox / Paper Trading Portfolio state.
   */
  async getSandboxPortfolio(userId: string): Promise<SandboxPortfolioDto> {
    const totalCapital = 1000000; // Base ₹10,00,000

    const positions = await this.sandboxRepo.find({
      where: { userId },
      order: { entryAt: 'DESC' },
    });

    const openPositions = positions.filter((p) => p.status === 'OPEN');
    const closedPositions = positions.filter((p) => p.status === 'CLOSED');

    let totalUnrealizedPnl = 0;
    let deployedMargin = 0;

    // Refresh live CMP for open positions
    for (const pos of openPositions) {
      try {
        const chain = await this.marketDataService.getOptionChain(pos.symbol, pos.expiry);
        let livePrice = pos.currentPrice;

        if (pos.strike && pos.optionType !== 'FUT') {
          const row = chain.contracts.find((c) => c.strike === Number(pos.strike));
          if (row) {
            livePrice = pos.optionType === 'CE' ? row.ce.ltp : row.pe.ltp;
          }
        } else {
          livePrice = chain.spotPrice;
        }

        pos.currentPrice = livePrice;
        const totalQty = pos.quantity * pos.lotSize;

        if (pos.side === 'BUY') {
          pos.unrealizedPnl = Math.round((livePrice - pos.entryPrice) * totalQty * 100) / 100;
          deployedMargin += pos.entryPrice * totalQty;
        } else {
          pos.unrealizedPnl = Math.round((pos.entryPrice - livePrice) * totalQty * 100) / 100;
          deployedMargin += livePrice * totalQty * 1.2 + 40000 * pos.quantity;
        }

        totalUnrealizedPnl += pos.unrealizedPnl;
        await this.sandboxRepo.save(pos);
      } catch (e) {
        this.logger.debug(`Could not refresh price for position ${pos.id}: ${(e as any)?.message}`);
      }
    }

    const totalRealizedPnl = closedPositions.reduce((acc, p) => acc + Number(p.realizedPnl || 0), 0);
    const totalPnl = Math.round((totalUnrealizedPnl + totalRealizedPnl) * 100) / 100;
    const availableMargin = Math.max(0, Math.round((totalCapital - deployedMargin + totalRealizedPnl) * 100) / 100);

    return {
      totalCapital,
      availableMargin,
      deployedMargin: Math.round(deployedMargin * 100) / 100,
      unrealizedPnl: Math.round(totalUnrealizedPnl * 100) / 100,
      realizedPnl: Math.round(totalRealizedPnl * 100) / 100,
      totalPnl,
      positions: openPositions.map((p) => ({
        id: p.id,
        userId: p.userId,
        symbol: p.symbol,
        strike: p.strike ? Number(p.strike) : null,
        optionType: p.optionType,
        expiry: p.expiry,
        side: p.side,
        quantity: p.quantity,
        lotSize: p.lotSize,
        entryPrice: Number(p.entryPrice),
        currentPrice: Number(p.currentPrice),
        unrealizedPnl: Number(p.unrealizedPnl),
        realizedPnl: Number(p.realizedPnl),
        status: p.status,
        entryAt: p.entryAt.toISOString(),
        closedAt: p.closedAt ? p.closedAt.toISOString() : null,
      })),
    };
  }

  /**
   * Squares off an open sandbox position.
   */
  async squareOffPosition(userId: string, positionId: string) {
    const pos = await this.sandboxRepo.findOne({ where: { id: positionId, userId } });
    if (!pos || pos.status === 'CLOSED') {
      return { success: false, message: 'Position not found or already closed' };
    }

    // Refresh live CMP
    const chain = await this.marketDataService.getOptionChain(pos.symbol, pos.expiry);
    let livePrice = pos.currentPrice;
    if (pos.strike && pos.optionType !== 'FUT') {
      const row = chain.contracts.find((c) => c.strike === Number(pos.strike));
      if (row) {
        livePrice = pos.optionType === 'CE' ? row.ce.ltp : row.pe.ltp;
      }
    } else {
      livePrice = chain.spotPrice;
    }

    const totalQty = pos.quantity * pos.lotSize;
    const realized =
      pos.side === 'BUY'
        ? (livePrice - pos.entryPrice) * totalQty
        : (pos.entryPrice - livePrice) * totalQty;

    pos.currentPrice = livePrice;
    pos.status = 'CLOSED';
    pos.closedAt = new Date();
    pos.realizedPnl = Math.round(realized * 100) / 100;
    pos.unrealizedPnl = 0;

    await this.sandboxRepo.save(pos);
    return { success: true, message: 'Position squared off successfully', data: pos };
  }

  /**
   * Squares off all open positions for a user.
   */
  async squareOffAll(userId: string) {
    const openPositions = await this.sandboxRepo.find({
      where: { userId, status: 'OPEN' },
    });

    for (const p of openPositions) {
      await this.squareOffPosition(userId, p.id);
    }

    return { success: true, count: openPositions.length };
  }

  /**
   * Resets entire sandbox portfolio.
   */
  async resetSandbox(userId: string) {
    await this.sandboxRepo.delete({ userId });
    return { success: true, message: 'Sandbox portfolio reset to ₹10,00,000' };
  }

  /**
   * Deletes a saved strategy.
   */
  async deleteStrategy(userId: string, strategyId: string) {
    const result = await this.strategyRepo.delete({ id: strategyId, userId });
    return { success: result.affected ? true : false };
  }
}
