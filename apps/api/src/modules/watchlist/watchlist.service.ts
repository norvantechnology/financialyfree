import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
  OnModuleInit,
  Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WatchlistItemEntity } from '../../database/entities/watchlist-item.entity';
import {
  CreateWatchlistItemDto,
  UpdateWatchlistAlertDto,
  WatchlistEnrichedItem,
} from './dto/watchlist-item.dto';
import { MarketIndexService } from '../techno-funda/market-index.service';
import { NotificationsService } from '../notifications/notifications.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class WatchlistService implements OnModuleInit {
  private readonly logger = new Logger(WatchlistService.name);
  private checkInterval: NodeJS.Timeout | null = null;

  constructor(
    @InjectRepository(WatchlistItemEntity)
    private readonly watchlistRepo: Repository<WatchlistItemEntity>,
    private readonly marketIndexService: MarketIndexService,
    private readonly notificationsService: NotificationsService,
    @Optional()
    @InjectQueue('watchlist-alerts')
    private readonly alertsQueue?: Queue,
  ) {}

  async onModuleInit() {
    // Schedule periodic BullMQ repeatable job or fallback interval for alert checking.
    // Never await Redis forever - that blocks Nest listen() and fails Render port scans.
    try {
      if (this.alertsQueue) {
        await Promise.race([
          this.alertsQueue.add(
            'periodic-check',
            {},
            {
              repeat: { every: 60000 }, // Every 60s
              removeOnComplete: true,
            },
          ),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Redis queue add timed out after 5s')), 5000),
          ),
        ]);
        this.logger.log('Registered BullMQ repeatable job: watchlist-alerts (60s cadence)');
      } else {
        this.setupFallbackInterval();
      }
    } catch (err: any) {
      this.logger.warn(`BullMQ queue registration deferred: ${err.message}. Enabling fallback timer.`);
      this.setupFallbackInterval();
    }
  }

  private setupFallbackInterval() {
    if (this.checkInterval) return;
    this.checkInterval = setInterval(async () => {
      try {
        await this.checkAlerts();
      } catch (err: any) {
        this.logger.warn(`Watchlist alert background evaluation: ${err.message}`);
      }
    }, 60000);
  }

  /** Bound parallel quote fetches so alert sweeps cannot open dozens of upstream sockets */
  private async mapPool<T, R>(
    items: T[],
    concurrency: number,
    fn: (item: T, index: number) => Promise<R>,
  ): Promise<R[]> {
    if (items.length === 0) return [];
    const results = new Array<R>(items.length);
    let cursor = 0;
    const workers = Array.from({ length: Math.min(Math.max(1, concurrency), items.length) }, async () => {
      while (cursor < items.length) {
        const i = cursor++;
        results[i] = await fn(items[i], i);
      }
    });
    await Promise.all(workers);
    return results;
  }

  async getWatchlist(userId: string): Promise<{ items: WatchlistEnrichedItem[]; totalCount: number }> {
    const rawItems = await this.watchlistRepo.find({
      where: { userId },
      order: { addedAt: 'DESC' },
    });

    if (rawItems.length === 0) {
      return { items: [], totalCount: 0 };
    }

    // Resolve live prices for each unique symbol (bounded concurrency)
    const uniqueSymbols = Array.from(new Set(rawItems.map((i) => i.symbol.toUpperCase())));
    const quotesMap = new Map<string, any>();

    await this.mapPool(uniqueSymbols, 6, async (sym) => {
      try {
        const quote = await this.resolveQuote(sym);
        if (quote) {
          quotesMap.set(sym, quote);
        }
      } catch {
        /* skip failed quote */
      }
    });

    const enriched: WatchlistEnrichedItem[] = rawItems.map((item) => {
      const symUpper = item.symbol.toUpperCase();
      const quote = quotesMap.get(symUpper);
      const currentPrice = quote ? quote.current : null;
      const change = quote ? quote.change : null;
      const changePct = quote ? quote.changePct : null;
      const previousClose = quote ? quote.previousClose : null;
      const dayHigh = quote ? quote.dayHigh : null;
      const dayLow = quote ? quote.dayLow : null;

      const alertPriceAbove = item.alertPriceAbove ? Number(item.alertPriceAbove) : null;
      const alertPriceBelow = item.alertPriceBelow ? Number(item.alertPriceBelow) : null;

      const alertAboveTriggered =
        currentPrice !== null && alertPriceAbove !== null && currentPrice >= alertPriceAbove;
      const alertBelowTriggered =
        currentPrice !== null && alertPriceBelow !== null && currentPrice <= alertPriceBelow;

      const distanceToAlertAbovePct =
        currentPrice && alertPriceAbove
          ? Math.round(((alertPriceAbove - currentPrice) / currentPrice) * 10000) / 100
          : null;

      const distanceToAlertBelowPct =
        currentPrice && alertPriceBelow
          ? Math.round(((currentPrice - alertPriceBelow) / currentPrice) * 10000) / 100
          : null;

      return {
        id: item.id,
        userId: item.userId,
        symbol: item.symbol,
        companyName: item.companyName || quote?.name || item.symbol,
        alertPriceAbove,
        alertPriceBelow,
        addedAt: item.addedAt.toISOString(),
        lastTriggeredAt: item.lastTriggeredAt ? item.lastTriggeredAt.toISOString() : null,
        notes: item.notes || null,
        currentPrice,
        change,
        changePct,
        previousClose,
        dayHigh,
        dayLow,
        alertAboveTriggered,
        alertBelowTriggered,
        distanceToAlertAbovePct,
        distanceToAlertBelowPct,
        lastPriceUpdated: quote?.lastUpdated || new Date().toISOString(),
      };
    });

    return {
      items: enriched,
      totalCount: enriched.length,
    };
  }

  async addItem(userId: string, dto: CreateWatchlistItemDto): Promise<WatchlistEnrichedItem> {
    const cleanSymbol = dto.symbol
      .trim()
      .toUpperCase()
      .replace(/\.(NS|BO)$/i, '');

    const existing = await this.watchlistRepo.findOne({
      where: { userId, symbol: cleanSymbol },
    });

    if (existing) {
      throw new ConflictException(`Symbol ${cleanSymbol} is already in your watchlist`);
    }

    // Fetch initial quote to populate companyName if missing
    let resolvedName = dto.companyName;
    let liveQuote: any = null;
    try {
      liveQuote = await this.resolveQuote(cleanSymbol);
      if (!resolvedName && liveQuote?.name) {
        resolvedName = liveQuote.name;
      }
    } catch {}

    const newItem = this.watchlistRepo.create({
      userId,
      symbol: cleanSymbol,
      companyName: resolvedName || cleanSymbol,
      alertPriceAbove: dto.alertPriceAbove !== undefined ? dto.alertPriceAbove : null,
      alertPriceBelow: dto.alertPriceBelow !== undefined ? dto.alertPriceBelow : null,
      notes: dto.notes || null,
    });

    const saved = await this.watchlistRepo.save(newItem);
    this.logger.log(`User ${userId} added ${cleanSymbol} to personal watchlist`);

    const currentPrice = liveQuote ? liveQuote.current : null;
    return {
      id: saved.id,
      userId: saved.userId,
      symbol: saved.symbol,
      companyName: saved.companyName,
      alertPriceAbove: saved.alertPriceAbove ? Number(saved.alertPriceAbove) : null,
      alertPriceBelow: saved.alertPriceBelow ? Number(saved.alertPriceBelow) : null,
      addedAt: saved.addedAt.toISOString(),
      lastTriggeredAt: null,
      notes: saved.notes || null,
      currentPrice,
      change: liveQuote?.change || null,
      changePct: liveQuote?.changePct || null,
      previousClose: liveQuote?.previousClose || null,
      dayHigh: liveQuote?.dayHigh || null,
      dayLow: liveQuote?.dayLow || null,
      alertAboveTriggered: false,
      alertBelowTriggered: false,
      distanceToAlertAbovePct: null,
      distanceToAlertBelowPct: null,
      lastPriceUpdated: liveQuote?.lastUpdated || new Date().toISOString(),
    };
  }

  async updateItem(
    userId: string,
    id: string,
    dto: UpdateWatchlistAlertDto,
  ): Promise<WatchlistEnrichedItem> {
    const item = await this.watchlistRepo.findOne({
      where: { id, userId },
    });

    if (!item) {
      throw new NotFoundException(`Watchlist item with ID ${id} not found`);
    }

    if (dto.alertPriceAbove !== undefined) {
      item.alertPriceAbove = dto.alertPriceAbove;
    }
    if (dto.alertPriceBelow !== undefined) {
      item.alertPriceBelow = dto.alertPriceBelow;
    }
    if (dto.notes !== undefined) {
      item.notes = dto.notes;
    }

    const saved = await this.watchlistRepo.save(item);

    // Enriched return
    const quote = await this.resolveQuote(saved.symbol);

    const currentPrice = quote?.current ?? null;
    const alertPriceAbove = saved.alertPriceAbove ? Number(saved.alertPriceAbove) : null;
    const alertPriceBelow = saved.alertPriceBelow ? Number(saved.alertPriceBelow) : null;

    return {
      id: saved.id,
      userId: saved.userId,
      symbol: saved.symbol,
      companyName: saved.companyName,
      alertPriceAbove,
      alertPriceBelow,
      addedAt: saved.addedAt.toISOString(),
      lastTriggeredAt: saved.lastTriggeredAt ? saved.lastTriggeredAt.toISOString() : null,
      notes: saved.notes || null,
      currentPrice,
      change: quote?.change ?? null,
      changePct: quote?.changePct ?? null,
      previousClose: quote?.previousClose ?? null,
      dayHigh: quote?.dayHigh ?? null,
      dayLow: quote?.dayLow ?? null,
      alertAboveTriggered: currentPrice !== null && alertPriceAbove !== null && currentPrice >= alertPriceAbove,
      alertBelowTriggered: currentPrice !== null && alertPriceBelow !== null && currentPrice <= alertPriceBelow,
      distanceToAlertAbovePct:
        currentPrice && alertPriceAbove
          ? Math.round(((alertPriceAbove - currentPrice) / currentPrice) * 10000) / 100
          : null,
      distanceToAlertBelowPct:
        currentPrice && alertPriceBelow
          ? Math.round(((currentPrice - alertPriceBelow) / currentPrice) * 10000) / 100
          : null,
      lastPriceUpdated: quote?.lastUpdated || new Date().toISOString(),
    };
  }

  async removeItem(userId: string, id: string): Promise<{ success: boolean; id: string }> {
    const item = await this.watchlistRepo.findOne({
      where: { id, userId },
    });

    if (!item) {
      throw new NotFoundException(`Watchlist item with ID ${id} not found`);
    }

    await this.watchlistRepo.remove(item);
    this.logger.log(`User ${userId} removed ${item.symbol} from watchlist`);
    return { success: true, id };
  }

  async checkSymbol(userId: string, symbol: string): Promise<{ isWatchlisted: boolean; item?: any }> {
    const clean = symbol
      .trim()
      .toUpperCase()
      .replace(/\.(NS|BO)$/i, '');

    const item = await this.watchlistRepo.findOne({
      where: { userId, symbol: clean },
    });

    if (!item) {
      return { isWatchlisted: false };
    }

    return {
      isWatchlisted: true,
      item: {
        id: item.id,
        symbol: item.symbol,
        alertPriceAbove: item.alertPriceAbove ? Number(item.alertPriceAbove) : null,
        alertPriceBelow: item.alertPriceBelow ? Number(item.alertPriceBelow) : null,
      },
    };
  }

  async checkAlerts(): Promise<{
    checkedCount: number;
    triggeredCount: number;
    triggeredAlerts: Array<{ symbol: string; currentPrice: number; condition: string; userId: string }>;
  }> {
    // 1. Fetch all items with at least one active alert target
    const items = await this.watchlistRepo
      .createQueryBuilder('w')
      .where('w.alertPriceAbove IS NOT NULL OR w.alertPriceBelow IS NOT NULL')
      .getMany();

    if (items.length === 0) {
      return { checkedCount: 0, triggeredCount: 0, triggeredAlerts: [] };
    }

    // 2. Fetch live prices for distinct symbols (bounded concurrency)
    const uniqueSymbols = Array.from(new Set(items.map((i) => i.symbol.toUpperCase())));
    const quotes = new Map<string, number>();

    await this.mapPool(uniqueSymbols, 6, async (sym) => {
      try {
        const q = await this.resolveQuote(sym);
        if (q && q.current > 0) {
          quotes.set(sym, q.current);
        }
      } catch {
        /* skip */
      }
    });

    const triggeredAlerts: Array<{
      symbol: string;
      currentPrice: number;
      condition: string;
      userId: string;
    }> = [];

    const now = Date.now();
    const ONE_HOUR = 60 * 60 * 1000;
    const toSave: WatchlistItemEntity[] = [];

    for (const item of items) {
      const sym = item.symbol.toUpperCase();
      const currentPrice = quotes.get(sym);
      if (!currentPrice) continue;

      const above = item.alertPriceAbove ? Number(item.alertPriceAbove) : null;
      const below = item.alertPriceBelow ? Number(item.alertPriceBelow) : null;

      // Throttle: don't re-trigger same alert within 1 hour
      const lastTriggered = item.lastTriggeredAt ? new Date(item.lastTriggeredAt).getTime() : 0;
      if (now - lastTriggered < ONE_HOUR) continue;

      let triggered = false;
      let conditionText = '';

      if (above !== null && currentPrice >= above) {
        triggered = true;
        conditionText = `crossed above target ₹${above} (CMP: ₹${currentPrice})`;
      } else if (below !== null && currentPrice <= below) {
        triggered = true;
        conditionText = `crossed below target ₹${below} (CMP: ₹${currentPrice})`;
      }

      if (triggered) {
        // Dispatch alert via existing NotificationsService (In-app + email/whatsapp based on DPDP consent)
        try {
          await this.notificationsService.sendNotification(
            item.userId,
            {
              userId: item.userId,
              title: `🔔 Price Alert: ${item.symbol} ${conditionText}`,
              message: `${item.companyName || item.symbol} is currently trading at ₹${currentPrice}. Target condition: ${conditionText}.`,
              channel: 'push',
              type: 'general' as any,
              metadata: {
                symbol: item.symbol,
                currentPrice,
                alertPriceAbove: above,
                alertPriceBelow: below,
                conditionText,
              },
            },
          );

          item.lastTriggeredAt = new Date();
          toSave.push(item);

          triggeredAlerts.push({
            symbol: item.symbol,
            currentPrice,
            condition: conditionText,
            userId: item.userId,
          });

          this.logger.log(`Price alert triggered for ${item.symbol} (${item.userId}): ${conditionText}`);
        } catch (err: any) {
          this.logger.error(`Failed to dispatch alert notification: ${err.message}`);
        }
      }
    }

    if (toSave.length > 0) {
      await this.watchlistRepo.save(toSave);
    }

    return {
      checkedCount: items.length,
      triggeredCount: triggeredAlerts.length,
      triggeredAlerts,
    };
  }

  private async resolveQuote(symbol: string): Promise<any> {
    const sym = symbol.trim().toUpperCase();
    const candidates =
      sym === 'TATAMOTORS' || sym === 'TATAMOTORS.NS'
        ? ['TATAMOTORS.NS', 'TMCV.NS']
        : sym.endsWith('.NS') || sym.endsWith('.BO')
          ? [sym]
          : [`${sym}.NS`, `${sym}.BO`];

    for (const ticker of candidates) {
      try {
        const quote = await this.marketIndexService.fetchQuote(ticker, sym, sym);
        if (quote && quote.current > 0) {
          return quote;
        }
      } catch {}
    }
    return null;
  }
}
