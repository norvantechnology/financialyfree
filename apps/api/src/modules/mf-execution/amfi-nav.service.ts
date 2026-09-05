import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import {
  MfSchemeEntity,
  MfNavHistoryEntity,
  MfFolioEntity,
} from '../../database/entities/mf.entity';

export interface AmfiSyncResult {
  totalParsed: number;
  schemesUpdated: number;
  historyRecordsAdded: number;
  durationMs: number;
  sourceUrl: string;
}

const CURATED_AMFI_SCHEMES = [
  {
    schemeCode: '122639',
    schemeName: 'Parag Parikh Flexi Cap Fund - Direct Plan - Growth',
    amcName: 'PPFAS Mutual Fund',
    category: 'Equity - Flexi Cap',
    subCategory: 'Growth',
    expenseRatio: 0.62,
    exitLoad: '2% within 365 days, 1% within 730 days',
    returns1yr: 28.5,
    returns3yr: 21.2,
    returns5yr: 24.8,
    riskLevel: 'very_high',
    minSipAmount: 1000,
    isRecommended: true,
  },
  {
    schemeCode: '118825',
    schemeName: 'Mirae Asset Large Cap Fund - Direct Plan - Growth',
    amcName: 'Mirae Asset Mutual Fund',
    category: 'Equity - Large Cap',
    subCategory: 'Growth',
    expenseRatio: 0.54,
    exitLoad: '1% within 365 days',
    returns1yr: 24.1,
    returns3yr: 16.5,
    returns5yr: 18.2,
    riskLevel: 'very_high',
    minSipAmount: 1000,
    isRecommended: true,
  },
  {
    schemeCode: '118778',
    schemeName: 'Nippon India Small Cap Fund - Direct Plan - Growth',
    amcName: 'Nippon India Mutual Fund',
    category: 'Equity - Small Cap',
    subCategory: 'Growth',
    expenseRatio: 0.69,
    exitLoad: '1% within 30 days',
    returns1yr: 38.4,
    returns3yr: 28.7,
    returns5yr: 31.4,
    riskLevel: 'very_high',
    minSipAmount: 1000,
    isRecommended: true,
  },
  {
    schemeCode: '120197',
    schemeName: 'ICICI Prudential Liquid Fund - Direct Plan - Growth',
    amcName: 'ICICI Prudential Mutual Fund',
    category: 'Debt - Liquid',
    subCategory: 'Growth',
    expenseRatio: 0.2,
    exitLoad: 'Graded exit load up to 7 days, Nil thereafter',
    returns1yr: 7.2,
    returns3yr: 6.5,
    returns5yr: 5.9,
    riskLevel: 'low',
    minSipAmount: 500,
    isRecommended: true,
  },
  {
    schemeCode: '120828',
    schemeName: 'Quant Small Cap Fund - Direct Plan - Growth',
    amcName: 'Quant Mutual Fund',
    category: 'Equity - Small Cap',
    subCategory: 'Growth',
    expenseRatio: 0.77,
    exitLoad: '1% within 365 days',
    returns1yr: 42.1,
    returns3yr: 32.4,
    returns5yr: 34.6,
    riskLevel: 'very_high',
    minSipAmount: 1000,
    isRecommended: true,
  },
  {
    schemeCode: '120716',
    schemeName: 'UTI Nifty 50 Index Fund - Direct Plan - Growth',
    amcName: 'UTI Mutual Fund',
    category: 'Equity - Index Fund',
    subCategory: 'Growth',
    expenseRatio: 0.22,
    exitLoad: 'Nil',
    returns1yr: 26.2,
    returns3yr: 15.8,
    returns5yr: 17.5,
    riskLevel: 'very_high',
    minSipAmount: 500,
    isRecommended: true,
  },
];

@Injectable()
export class AmfiNavService implements OnModuleInit {
  private readonly logger = new Logger(AmfiNavService.name);

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(MfSchemeEntity)
    private readonly schemeRepo: Repository<MfSchemeEntity>,
    @InjectRepository(MfNavHistoryEntity)
    private readonly navHistoryRepo: Repository<MfNavHistoryEntity>,
    @InjectRepository(MfFolioEntity)
    private readonly folioRepo: Repository<MfFolioEntity>,
  ) {}

  async onModuleInit() {
    // Perform initial sync on startup asynchronously to not block Nest bootstrap
    setTimeout(() => {
      this.syncDailyNavs().catch((err) => {
        this.logger.warn(`Initial AMFI NAV sync deferred or failed: ${err.message}`);
      });
    }, 2000);
  }

  private parseAmfiDate(dStr: string): string {
    const months: Record<string, string> = {
      Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
      Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12',
    };
    const parts = dStr.split('-');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = months[parts[1]] || '01';
      const year = parts[2];
      return `${year}-${month}-${day}`;
    }
    return new Date().toISOString().split('T')[0];
  }

  async syncDailyNavs(): Promise<AmfiSyncResult> {
    const startTime = Date.now();
    const navUrl =
      this.config.get<string>('AMFI_NAV_URL') ||
      'https://portal.amfiindia.com/spages/NAVAll.txt';

    this.logger.log(`📥 Ingesting live AMFI NAV feed from: ${navUrl}`);

    const resp = await fetch(navUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 FinanciallyFree/1.0' },
      signal: AbortSignal.timeout(25000),
    });

    if (!resp.ok) {
      throw new Error(`Failed to fetch AMFI NAV feed: HTTP ${resp.status} ${resp.statusText}`);
    }

    const text = await resp.text();
    const lines = text.split('\n');

    // Parse map of schemeCode -> { nav, date }
    const navMap = new Map<string, { nav: number; date: string; schemeName?: string }>();
    let totalParsed = 0;

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || !line.includes(';')) continue;
      const parts = line.split(';');
      if (parts.length < 6) continue;

      const code = parts[0]?.trim();
      if (!code || isNaN(Number(code))) continue;

      let navStr = '';
      let dateStr = '';
      let schemeName = '';

      if (parts.length >= 8) {
        navStr = parts[6]?.trim() || '';
        dateStr = parts[7]?.trim() || '';
        schemeName = `${parts[3]?.trim()} - ${parts[4]?.trim()} - ${parts[5]?.trim()}`;
      } else if (parts.length >= 6) {
        navStr = parts[4]?.trim() || '';
        dateStr = parts[5]?.trim() || '';
        schemeName = parts[3]?.trim();
      }

      const nav = parseFloat(navStr);
      if (!isNaN(nav) && nav > 0) {
        const isoDate = this.parseAmfiDate(dateStr);
        navMap.set(code, { nav, date: isoDate, schemeName });
        totalParsed++;
      }
    }

    this.logger.log(`📊 Successfully parsed ${totalParsed} active schemes from AMFI master file`);

    // Ensure curated schemes exist in database
    for (const curated of CURATED_AMFI_SCHEMES) {
      const existing = await this.schemeRepo.findOne({
        where: { schemeCode: curated.schemeCode },
      });
      if (!existing) {
        const amfiData = navMap.get(curated.schemeCode);
        const entity = this.schemeRepo.create({
          ...curated,
          navCurrent: amfiData ? amfiData.nav : 100,
          navDate: amfiData ? amfiData.date : new Date().toISOString().split('T')[0],
          isActive: true,
        });
        await this.schemeRepo.save(entity);
        this.logger.log(`🌱 Registered curated scheme: ${curated.schemeName} (${curated.schemeCode})`);
      }
    }

    // Update all registered schemes with their genuine live NAVs
    const dbSchemes = await this.schemeRepo.find();
    let schemesUpdated = 0;
    let historyRecordsAdded = 0;

    for (const scheme of dbSchemes) {
      const live = navMap.get(scheme.schemeCode);
      if (live) {
        const prevNav = Number(scheme.navCurrent);
        scheme.navCurrent = live.nav;
        scheme.navDate = live.date;
        await this.schemeRepo.save(scheme);
        schemesUpdated++;

        // Add to nav_history if date entry does not already exist
        const existingHistory = await this.navHistoryRepo.findOne({
          where: { schemeCode: scheme.schemeCode, navDate: live.date },
        });
        if (!existingHistory) {
          const historyEntry = this.navHistoryRepo.create({
            schemeCode: scheme.schemeCode,
            nav: live.nav,
            navDate: live.date,
          });
          await this.navHistoryRepo.save(historyEntry);
          historyRecordsAdded++;
        }

        // Re-value active user folios holding this scheme
        const affectedFolios = await this.folioRepo.find({
          where: { schemeCode: scheme.schemeCode },
        });
        for (const folio of affectedFolios) {
          folio.navCurrent = live.nav;
          folio.currentValue = Math.round(Number(folio.units) * live.nav);
          folio.lastUpdated = new Date();
          await this.folioRepo.save(folio);
        }

        this.logger.log(
          `💹 Updated ${scheme.schemeName} (${scheme.schemeCode}): NAV ${prevNav} -> ${live.nav} on ${live.date}`,
        );
      }
    }

    const durationMs = Date.now() - startTime;
    this.logger.log(
      `✅ AMFI NAV sync completed in ${durationMs}ms: ${schemesUpdated} schemes updated, ${historyRecordsAdded} history snapshots recorded.`,
    );

    return {
      totalParsed,
      schemesUpdated,
      historyRecordsAdded,
      durationMs,
      sourceUrl: navUrl,
    };
  }

  async getNavHistory(schemeCode: string, limit = 30): Promise<MfNavHistoryEntity[]> {
    return this.navHistoryRepo.find({
      where: { schemeCode },
      order: { navDate: 'DESC' },
      take: limit,
    });
  }
}
