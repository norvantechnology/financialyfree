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
  SandboxPositionDto,
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
   * Chain IV is stored as percent (e.g. 14.5); decimal values (0.145) are normalized.
   */
  async getIvSmile(underlying: string, expiry?: string): Promise<{
    underlying: string;
    expiry: string;
    spotPrice: number;
    atmIv: number | null;
    points: IvSmilePointDto[];
    source?: string;
    dataNote?: string;
  }> {
    const chain = await this.marketDataService.getOptionChain(underlying, expiry);

    const toPct = (iv: number | null | undefined): number | null => {
      if (iv == null || !Number.isFinite(iv)) return null;
      return iv > 1 ? iv : iv * 100;
    };

    const points: IvSmilePointDto[] = chain.contracts.map((row) => {
      const isAtm = row.strike === chain.atmStrike;
      const ce = toPct(row.ce.iv);
      const pe = toPct(row.pe.iv);
      const avgIv =
        ce != null && pe != null
          ? Math.round(((ce + pe) / 2) * 100) / 100
          : ce ?? pe ?? null;

      return {
        strike: row.strike,
        iv: avgIv ?? 0,
        callLtp: row.ce.ltp,
        putLtp: row.pe.ltp,
        isAtm,
      };
    });

    const atmIvRaw = toPct(chain.atmIv);

    return {
      underlying: chain.underlying,
      expiry: chain.selectedExpiry,
      spotPrice: chain.spotPrice,
      atmIv: atmIvRaw,
      points: points.filter((p) => p.iv > 0),
      source: chain.source,
      dataNote: chain.dataNote,
    };
  }

  /**
   * Generates Volatility Surface across multiple expiries for an underlying.
   */
  async getVolSurface(underlying: string): Promise<{
    underlying: string;
    spotPrice: number;
    surfaces: VolSurfaceExpiryDto[];
    source?: string;
    dataNote?: string;
  }> {
    const baseChain = await this.marketDataService.getOptionChain(underlying);
    const expiries = baseChain.expiryDates.slice(0, 4);

    const toPct = (iv: number | null | undefined): number | null => {
      if (iv == null || !Number.isFinite(iv)) return null;
      return iv > 1 ? iv : iv * 100;
    };

    const surfaces: VolSurfaceExpiryDto[] = [];
    const now = new Date();

    for (const exp of expiries) {
      try {
        const chain = await this.marketDataService.getOptionChain(underlying, exp);
        const expDate = new Date(exp);
        const diffMs = expDate.getTime() - now.getTime();
        const dte = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

        const strikes = chain.contracts
          .map((c) => {
            const ivVal = toPct(c.ce.iv ?? c.pe.iv);
            if (ivVal == null) return null;
            return { strike: c.strike, iv: Math.round(ivVal * 100) / 100 };
          })
          .filter(Boolean) as Array<{ strike: number; iv: number }>;

        if (strikes.length) {
          surfaces.push({ expiry: exp, dte, strikes });
        }
      } catch (e) {
        this.logger.debug(`Could not compute surface for expiry ${exp}: ${(e as any)?.message}`);
      }
    }

    return {
      underlying: baseChain.underlying,
      spotPrice: baseChain.spotPrice,
      surfaces,
      source: baseChain.source,
      dataNote: baseChain.dataNote,
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
    const selectedExpiry = chain.selectedExpiry || '';

    // Empty expiry cannot query Postgres date columns — return honestly empty
    if (!selectedExpiry) {
      return { underlying, expiry: '', points: [] };
    }

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

    if (snapshots.length > 0) {
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

    // No invented intraday series — return empty until real oi_snapshots exist
    // (or a single current point when live chain OI is available)
    if (chain.contracts.length > 0 && (chain.source === 'NSE_LIVE' || chain.source === 'BROKER_LIVE')) {
      const totalCallOi = chain.contracts.reduce((acc, c) => acc + c.ce.oi, 0);
      const totalPutOi = chain.contracts.reduce((acc, c) => acc + c.pe.oi, 0);
      const pcrVal = totalCallOi > 0 ? Math.round((totalPutOi / totalCallOi) * 100) / 100 : 0;
      return {
        underlying,
        expiry: selectedExpiry,
        points: [
          {
            timestamp: chain.timestamp,
            callOi: totalCallOi,
            putOi: totalPutOi,
            pcr: pcrVal,
            spotPrice: chain.spotPrice,
          },
        ],
      };
    }

    return {
      underlying,
      expiry: selectedExpiry,
      points: [],
    };
  }

  /**
   * Takes a live snapshot of OI for all strikes of an underlying.
   * Skips DELAYED_SPOT_ONLY / empty chains so we never persist fabricated OI.
   */
  async recordOiSnapshot(underlying: string, expiry?: string): Promise<number> {
    const chain = await this.marketDataService.getOptionChain(underlying, expiry);
    if (!chain.contracts.length || chain.source === 'DELAYED_SPOT_ONLY') {
      return 0;
    }
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
   * Fetches full Sandbox / Paper Trading Portfolio state with live mark-to-market.
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
    let marksSource = 'FALLBACK';
    let liveQuoteCount = 0;

    // One shared-cache chain per symbol:expiry (preferFresh — do not hammer NSE every poll)
    const chainCache = new Map<string, Awaited<ReturnType<typeof this.marketDataService.getOptionChain>>>();
    const loadChain = async (symbol: string, expiry: string | Date) => {
      const expiryIso = this.marketDataService.toExpiryIso(expiry);
      const key = `${symbol}|${expiryIso}`;
      let chain = chainCache.get(key);
      if (!chain) {
        chain = await this.marketDataService.getOptionChain(
          symbol,
          expiryIso,
          undefined,
          undefined,
          { preferFresh: true },
        );
        chainCache.set(key, chain);
      }
      return chain;
    };

    const expiryOk = (chainExp: string | undefined, posExp: string | Date) => {
      return this.marketDataService.toExpiryIso(chainExp) === this.marketDataService.toExpiryIso(posExp);
    };

    const quoteOption = (
      chain: Awaited<ReturnType<typeof this.marketDataService.getOptionChain>>,
      strike: number,
      optionType: string,
    ): number => {
      const row = chain.contracts.find((c) => Math.abs(Number(c.strike) - strike) < 0.51);
      if (!row) return 0;
      const side = optionType === 'CE' ? row.ce : row.pe;
      const ltp = Number(side?.ltp) || 0;
      if (ltp > 0) return ltp;
      const bid = Number(side?.bidPrice) || 0;
      const ask = Number(side?.askPrice) || 0;
      if (bid > 0 && ask > 0) return Math.round(((bid + ask) / 2) * 100) / 100;
      if (bid > 0) return bid;
      if (ask > 0) return ask;
      return 0;
    };

    const resolveLivePrice = async (
      pos: (typeof openPositions)[number],
    ): Promise<{ price: number; live: boolean; source?: string }> => {
      const entry = Number(pos.entryPrice) || 0;
      // Prefer last good mark over entry when a refresh fails
      const fallback =
        Number(pos.currentPrice) > 0 ? Number(pos.currentPrice) : entry > 0 ? entry : 0;
      try {
        const chain = await loadChain(pos.symbol, pos.expiry);
        if (!expiryOk(chain.selectedExpiry, pos.expiry)) {
          this.logger.warn(
            `Sandbox mark skipped: wanted expiry ${this.marketDataService.toExpiryIso(pos.expiry)}, got ${chain.selectedExpiry} (${chain.source})`,
          );
          return { price: fallback, live: false, source: chain.source };
        }
        if (pos.strike != null && pos.optionType !== 'FUT') {
          const quote = quoteOption(chain, Number(pos.strike), String(pos.optionType));
          if (quote > 0) return { price: quote, live: true, source: chain.source };
        } else if (chain.spotPrice > 0) {
          return { price: chain.spotPrice, live: true, source: chain.source };
        }
        return { price: fallback, live: false, source: chain.source };
      } catch (e) {
        this.logger.debug(`Could not refresh price for position ${pos.id}: ${(e as any)?.message}`);
      }
      return { price: fallback, live: false };
    };

    const marked = await Promise.all(
      openPositions.map(async (pos) => {
        const { price: livePrice, live, source } = await resolveLivePrice(pos);
        if (live) {
          liveQuoteCount += 1;
          if (source) marksSource = String(source);
        }
        pos.currentPrice = livePrice;
        const totalQty = pos.quantity * pos.lotSize;
        const entry = Number(pos.entryPrice);

        let unrealized: number;
        let margin: number;
        if (pos.side === 'BUY') {
          unrealized = Math.round((livePrice - entry) * totalQty * 100) / 100;
          margin = entry * totalQty;
        } else {
          unrealized = Math.round((entry - livePrice) * totalQty * 100) / 100;
          margin = Math.max(livePrice, entry) * totalQty * 1.2 + 40000 * pos.quantity;
        }
        pos.unrealizedPnl = unrealized;
        return { pos, live, unrealized, margin };
      }),
    );

    if (openPositions.length > 0 && liveQuoteCount === 0) {
      marksSource = 'AWAITING_QUOTE';
    }

    for (const m of marked) {
      totalUnrealizedPnl += m.unrealized;
      deployedMargin += m.margin;
    }

    // Persist marks in parallel
    if (marked.length > 0) {
      await Promise.all(marked.map(({ pos }) => this.sandboxRepo.save(pos)));
    }

    const totalRealizedPnl = closedPositions.reduce((acc, p) => acc + Number(p.realizedPnl || 0), 0);
    const totalPnl = Math.round((totalUnrealizedPnl + totalRealizedPnl) * 100) / 100;
    const availableMargin = Math.max(0, Math.round((totalCapital - deployedMargin + totalRealizedPnl) * 100) / 100);

    const mapPos = (
      pos: (typeof positions)[number],
      extra?: { quoteLive?: boolean },
    ): SandboxPositionDto => ({
      id: pos.id,
      userId: pos.userId,
      symbol: pos.symbol,
      strike: pos.strike ? Number(pos.strike) : null,
      optionType: pos.optionType,
      expiry: this.marketDataService.toExpiryIso(pos.expiry),
      side: pos.side,
      quantity: pos.quantity,
      lotSize: pos.lotSize,
      entryPrice: Number(pos.entryPrice),
      currentPrice: Number(pos.currentPrice),
      unrealizedPnl: Number(pos.unrealizedPnl),
      realizedPnl: Number(pos.realizedPnl),
      status: pos.status,
      entryAt: pos.entryAt.toISOString(),
      closedAt: pos.closedAt ? pos.closedAt.toISOString() : null,
      quoteLive: extra?.quoteLive,
    });

    const historySorted = [...closedPositions].sort((a, b) => {
      const ta = a.closedAt ? new Date(a.closedAt).getTime() : 0;
      const tb = b.closedAt ? new Date(b.closedAt).getTime() : 0;
      return tb - ta;
    });

    return {
      totalCapital,
      availableMargin,
      deployedMargin: Math.round(deployedMargin * 100) / 100,
      unrealizedPnl: Math.round(totalUnrealizedPnl * 100) / 100,
      realizedPnl: Math.round(totalRealizedPnl * 100) / 100,
      totalPnl,
      asOf: new Date().toISOString(),
      marksSource,
      positions: marked.map(({ pos, live }) => mapPos(pos, { quoteLive: live })),
      history: historySorted.slice(0, 50).map((p) => mapPos(p)),
    };
  }

  /**
   * Squares off an open sandbox position.
   */
  async squareOffPosition(userId: string, positionId: string) {
    if (!userId || !positionId) {
      return { success: false, message: 'Sign in required' };
    }
    const pos = await this.sandboxRepo.findOne({ where: { id: positionId, userId } });
    if (!pos || pos.status === 'CLOSED') {
      return { success: false, message: 'Position not found or already closed' };
    }

    const expiryIso = this.marketDataService.toExpiryIso(pos.expiry);
    const chain = await this.marketDataService.getOptionChain(
      pos.symbol,
      expiryIso,
      undefined,
      undefined,
      { forceRefresh: true },
    );
    let livePrice =
      Number(pos.currentPrice) > 0
        ? Number(pos.currentPrice)
        : Number(pos.entryPrice) > 0
          ? Number(pos.entryPrice)
          : 0;
    const expiryOk =
      chain.selectedExpiry &&
      expiryIso &&
      this.marketDataService.toExpiryIso(chain.selectedExpiry) === expiryIso;
    if (pos.strike != null && pos.optionType !== 'FUT' && expiryOk) {
      const row = chain.contracts.find(
        (c) => Math.abs(Number(c.strike) - Number(pos.strike)) < 0.51,
      );
      if (row) {
        const side = pos.optionType === 'CE' ? row.ce : row.pe;
        const ltp = Number(side?.ltp) || 0;
        const bid = Number(side?.bidPrice) || 0;
        const ask = Number(side?.askPrice) || 0;
        const mid = bid > 0 && ask > 0 ? (bid + ask) / 2 : 0;
        const quote = ltp > 0 ? ltp : mid > 0 ? mid : bid > 0 ? bid : ask;
        if (quote > 0) livePrice = quote;
      }
    } else if (pos.optionType === 'FUT' && chain.spotPrice > 0) {
      livePrice = chain.spotPrice;
    }

    const totalQty = pos.quantity * pos.lotSize;
    const realized =
      pos.side === 'BUY'
        ? (livePrice - Number(pos.entryPrice)) * totalQty
        : (Number(pos.entryPrice) - livePrice) * totalQty;

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
    if (!userId) {
      return { success: false, message: 'Sign in required', count: 0 };
    }
    const openPositions = await this.sandboxRepo.find({
      where: { userId, status: 'OPEN' },
    });

    let closed = 0;
    const errors: string[] = [];
    for (const p of openPositions) {
      const result = await this.squareOffPosition(userId, p.id);
      if (result.success) closed += 1;
      else if (result.message) errors.push(result.message);
    }

    return {
      success: errors.length === 0 || closed > 0,
      count: closed,
      message:
        closed > 0
          ? `Squared off ${closed} position${closed === 1 ? '' : 's'}`
          : errors[0] || 'No open positions to square off',
      errors: errors.length ? errors : undefined,
    };
  }

  /**
   * Resets entire sandbox portfolio.
   */
  async resetSandbox(userId: string) {
    if (!userId) {
      return { success: false, message: 'Sign in required' };
    }
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
