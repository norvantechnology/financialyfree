import { Injectable, Logger, Optional } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { VahanDataPointDto } from '@ff/types';

export interface VahanStateRegistration {
  stateCode: string;
  stateName: string;
  totalRegistrations: number;
  formattedCount: string;
}

export interface VahanSnapshot {
  id: string;
  snapshotDate: string; // YYYY-MM-DD
  category: string;     // '2W', 'PV', 'CV', 'Tractor', or state codes
  label: string;
  registrations: number;
  recordedAt: string;   // ISO timestamp
  isLiveScraped: boolean;
  source: string;
}

export interface VahanCategoryDetail {
  category: string;
  label: string;
  registrations: number;
  formattedRegistrations: string;
  yoyChange: number | null;
  yoyStatusText: string;
  momChange: number | null;
  keyOEMs: string[];
  oemDisclaimer: string;
  isModeled: boolean;
  volumeNote: string;
}

export interface VahanDashboardPayload {
  mode: 'LIVE_FETCH' | 'STATIC_SEED' | 'UNAVAILABLE';
  status: 'SUCCESS' | 'FAILURE';
  categories: VahanCategoryDetail[];
  topStates: VahanStateRegistration[];
  dataPoints: VahanDataPointDto[];
  dataSource: string;
  retrievedAt: string;
  isLiveScraped: boolean;
  refreshCadence: string;
  historicalSnapshotsCount: number;
  yoyCalculationStatus: string;
}

interface VahanCacheEntry {
  data: VahanDashboardPayload;
  expiresAt: number;
}

const STATE_NAMES: Record<string, string> = {
  UP: 'Uttar Pradesh',
  MH: 'Maharashtra',
  TN: 'Tamil Nadu',
  KA: 'Karnataka',
  GJ: 'Gujarat',
  RJ: 'Rajasthan',
  MP: 'Madhya Pradesh',
  WB: 'West Bengal',
};

@Injectable()
export class VahanEtlService {
  private readonly logger = new Logger(VahanEtlService.name);
  private cache: VahanCacheEntry | null = null;
  private readonly CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours (Vahan updates daily/monthly)
  private readonly memorySnapshots: Map<string, VahanSnapshot> = new Map();
  private isTableInitialized = false;

  constructor(
    @Optional()
    @InjectDataSource()
    private readonly dataSource?: DataSource,
  ) {}

  private async ensureSnapshotTable(): Promise<void> {
    if (this.isTableInitialized || !this.dataSource || !this.dataSource.isInitialized) {
      return;
    }
    try {
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS vahan_snapshots (
          id VARCHAR(64) PRIMARY KEY,
          snapshot_date VARCHAR(10) NOT NULL,
          category VARCHAR(32) NOT NULL,
          label VARCHAR(128) NOT NULL,
          registrations BIGINT NOT NULL,
          recorded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
          is_live_scraped BOOLEAN NOT NULL DEFAULT false,
          source VARCHAR(256) NOT NULL,
          CONSTRAINT uq_vahan_snapshot_date_cat UNIQUE (snapshot_date, category)
        );
        CREATE INDEX IF NOT EXISTS idx_vahan_snapshots_date ON vahan_snapshots(snapshot_date);
      `);
      this.isTableInitialized = true;
    } catch (err: any) {
      this.logger.warn(`Could not ensure vahan_snapshots table in DB: ${err.message}. Relying on in-memory snapshot store.`);
    }
  }

  async saveSnapshot(item: Omit<VahanSnapshot, 'id'>): Promise<VahanSnapshot> {
    const id = `vsnap_${item.snapshotDate}_${item.category}`;
    const snapshot: VahanSnapshot = { id, ...item };
    this.memorySnapshots.set(id, snapshot);

    if (this.dataSource && this.dataSource.isInitialized) {
      try {
        await this.ensureSnapshotTable();
        await this.dataSource.query(
          `INSERT INTO vahan_snapshots (id, snapshot_date, category, label, registrations, recorded_at, is_live_scraped, source)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (snapshot_date, category) DO UPDATE
           SET registrations = EXCLUDED.registrations,
               recorded_at = EXCLUDED.recorded_at,
               is_live_scraped = EXCLUDED.is_live_scraped`,
          [
            snapshot.id,
            snapshot.snapshotDate,
            snapshot.category,
            snapshot.label,
            snapshot.registrations,
            snapshot.recordedAt,
            snapshot.isLiveScraped,
            snapshot.source,
          ],
        );
      } catch (err: any) {
        this.logger.warn(`Failed to persist snapshot to PostgreSQL: ${err.message}`);
      }
    }

    return snapshot;
  }

  async getSnapshots(category?: string): Promise<VahanSnapshot[]> {
    if (this.dataSource && this.dataSource.isInitialized) {
      try {
        await this.ensureSnapshotTable();
        const rows: any[] = category
          ? await this.dataSource.query(
              `SELECT id, snapshot_date as "snapshotDate", category, label, registrations, recorded_at as "recordedAt", is_live_scraped as "isLiveScraped", source
               FROM vahan_snapshots WHERE category = $1 ORDER BY snapshot_date DESC`,
              [category],
            )
          : await this.dataSource.query(
              `SELECT id, snapshot_date as "snapshotDate", category, label, registrations, recorded_at as "recordedAt", is_live_scraped as "isLiveScraped", source
               FROM vahan_snapshots ORDER BY snapshot_date DESC`,
            );
        if (rows && rows.length > 0) {
          return rows.map((r) => ({
            ...r,
            registrations: Number(r.registrations),
          }));
        }
      } catch (err: any) {
        this.logger.warn(`Failed to query snapshots from PostgreSQL: ${err.message}`);
      }
    }

    const all = Array.from(this.memorySnapshots.values());
    return category ? all.filter((s) => s.category === category) : all;
  }

  async computeYoY(
    category: string,
    currentUnits: number,
  ): Promise<{ yoyChange: number | null; yoyStatusText: string; isRealHistorical: boolean }> {
    const snapshots = await this.getSnapshots(category);
    // Looking for a historical snapshot approximately 365 days ago (+/- 30 days)
    const now = new Date();
    const targetPast = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    const minTime = targetPast.getTime() - 30 * 24 * 60 * 60 * 1000;
    const maxTime = targetPast.getTime() + 30 * 24 * 60 * 60 * 1000;

    const historical = snapshots.find((s) => {
      const snapTime = new Date(s.snapshotDate).getTime();
      return snapTime >= minTime && snapTime <= maxTime;
    });

    if (historical && historical.registrations > 0) {
      const diff = currentUnits - historical.registrations;
      const pct = (diff / historical.registrations) * 100;
      const rounded = Math.round(pct * 10) / 10;
      return {
        yoyChange: rounded,
        yoyStatusText: `${rounded > 0 ? '+' : ''}${rounded.toFixed(1)}% YoY Growth`,
        isRealHistorical: true,
      };
    }

    return {
      yoyChange: null,
      yoyStatusText: 'YoY trend building  insufficient historical data yet',
      isRealHistorical: false,
    };
  }

  private async persistDashboardSnapshots(
    categories: Array<{ category: string; label: string; registrations: number }>,
    topStates: VahanStateRegistration[],
    isLive: boolean,
  ): Promise<void> {
    const today = new Date().toISOString().slice(0, 10);
    const nowIso = new Date().toISOString();
    const source = isLive ? 'parivahan.gov.in (Live Scrape)' : 'parivahan.gov.in (Baseline Cache)';

    for (const cat of categories) {
      await this.saveSnapshot({
        snapshotDate: today,
        category: cat.category,
        label: cat.label,
        registrations: cat.registrations,
        recordedAt: nowIso,
        isLiveScraped: isLive,
        source,
      });
    }

    for (const st of topStates) {
      await this.saveSnapshot({
        snapshotDate: today,
        category: `STATE_${st.stateCode}`,
        label: `${st.stateName} Registrations`,
        registrations: st.totalRegistrations,
        recordedAt: nowIso,
        isLiveScraped: isLive,
        source,
      });
    }
  }

  async getVahanData(forceRefresh = false): Promise<VahanDashboardPayload> {
    const now = Date.now();
    if (!forceRefresh && this.cache && this.cache.expiresAt > now) {
      return this.cache.data;
    }

    try {
      this.logger.log('🚗 Starting scheduled ETL scrape against VAHAN 4 Dashboard (parivahan.gov.in)...');
      const liveStates = await this.scrapeVahanDashboard();
      
      const payload = await this.buildPayload(liveStates, true);
      await this.persistDashboardSnapshots(payload.categories, liveStates, true);
      this.cache = {
        data: payload,
        expiresAt: now + this.CACHE_TTL_MS,
      };
      this.logger.log(`✅ VAHAN ETL scrape succeeded: ${liveStates.length} top states extracted.`);
      return payload;
    } catch (err: any) {
      this.logger.warn(`VAHAN live scrape failed or timed out: ${err.message}. Returning UNAVAILABLE empty payload.`);
      if (this.cache) {
        return this.cache.data;
      }
      const unavailable = await this.buildUnavailablePayload();
      this.cache = {
        data: unavailable,
        expiresAt: now + Math.min(this.CACHE_TTL_MS, 15 * 60 * 1000),
      };
      return unavailable;
    }
  }

  private async scrapeVahanDashboard(): Promise<VahanStateRegistration[]> {
    const url = 'https://vahan.parivahan.gov.in/vahan4dashboard/vahan/dashboardview.xhtml';
    const userAgent =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

    // Step 1: Initial GET to obtain session cookie & ViewState
    const getResp = await fetch(url, {
      headers: { 'User-Agent': userAgent },
      signal: AbortSignal.timeout(12000),
    });

    if (!getResp.ok) {
      throw new Error(`Initial GET HTTP ${getResp.status}`);
    }

    const setCookieHeader = getResp.headers.get('set-cookie') || '';
    const cookie = setCookieHeader.split(';')[0] || '';
    const html = await getResp.text();

    const viewStateMatch = html.match(/name="javax\.faces\.ViewState"[^>]*value="([^"]+)"/);
    if (!viewStateMatch || !viewStateMatch[1]) {
      throw new Error('javax.faces.ViewState token not found in dashboard HTML');
    }

    const viewState = viewStateMatch[1];

    // Step 2a: Trigger comparison panel expansion (j_idt51)
    const step1Body = new URLSearchParams({
      'javax.faces.partial.ajax': 'true',
      'javax.faces.source': 'j_idt51',
      'javax.faces.partial.execute': '@all',
      'javax.faces.partial.render': 'comparison dashboardContentsPanel mainpagepnl',
      'j_idt51': 'j_idt51',
      'masterLayout_formlogin': 'masterLayout_formlogin',
      'javax.faces.ViewState': viewState,
    }).toString();

    const step1Resp = await fetch(url, {
      method: 'POST',
      body: step1Body,
      headers: {
        'User-Agent': userAgent,
        'Faces-Request': 'partial/ajax',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        Cookie: cookie,
      },
      signal: AbortSignal.timeout(12000),
    });

    if (!step1Resp.ok) {
      throw new Error(`Step 1 AJAX POST HTTP ${step1Resp.status}`);
    }

    const xml1 = await step1Resp.text();
    const vsMatch1 = xml1.match(
      /<update id="j_id1:javax\.faces\.ViewState:0"><!\[CDATA\[([^\]]+)\]\]><\/update>/,
    );
    const updatedViewState = vsMatch1 ? vsMatch1[1] : viewState;

    const rcMatch = xml1.match(
      /rcbarRegnYear\s*=\s*function\(\)\s*\{PrimeFaces\.ab\(\{s:"([^"]+)"/,
    );
    const sourceId = rcMatch ? rcMatch[1] : 'j_idt627';

    // Step 2b: Trigger rcbarRegnYear to render the year-wise comparison chart
    const step2Body = new URLSearchParams({
      'javax.faces.partial.ajax': 'true',
      'javax.faces.source': sourceId,
      'javax.faces.partial.execute': '@all',
      'javax.faces.partial.render': 'regnYearWiseCompChart',
      [sourceId]: sourceId,
      'masterLayout_formlogin': 'masterLayout_formlogin',
      'javax.faces.ViewState': updatedViewState,
    }).toString();

    const postResp = await fetch(url, {
      method: 'POST',
      body: step2Body,
      headers: {
        'User-Agent': userAgent,
        'Faces-Request': 'partial/ajax',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        Cookie: cookie,
      },
      signal: AbortSignal.timeout(12000),
    });

    if (!postResp.ok) {
      throw new Error(`AJAX POST HTTP ${postResp.status}`);
    }

    const xml = await postResp.text();

    // Step 3: Extract ticks and data array from PrimeFaces script block
    // e.g. data:[[5.6451661E7,4.4464252E7,...]] and ticks:["UP","MH","TN","KA","GJ"]
    const ticksMatch = xml.match(/ticks:\[([^\]]+)\]/);
    const dataMatch = xml.match(/data:\[\[([^\]]+)\]\]/);

    if (!ticksMatch || !dataMatch) {
      throw new Error('Could not regex-match chart ticks or values in PrimeFaces response');
    }

    const ticks = ticksMatch[1]
      .split(',')
      .map((t) => t.trim().replace(/['"]/g, ''));
    const numbers = dataMatch[1]
      .split(',')
      .map((n) => parseFloat(n.trim()));

    const result: VahanStateRegistration[] = [];
    for (let i = 0; i < ticks.length; i++) {
      const code = ticks[i];
      const count = Math.round(numbers[i] || 0);
      const crore = (count / 10000000).toFixed(2);
      result.push({
        stateCode: code,
        stateName: STATE_NAMES[code] || code,
        totalRegistrations: count,
        formattedCount: `${crore} Cr`,
      });
    }

    if (result.length === 0) {
      throw new Error('VAHAN scrape returned no state registration ticks');
    }

    return result;
  }

  private async buildUnavailablePayload(): Promise<VahanDashboardPayload> {
    const allSnapshots = await this.getSnapshots();
    return {
      mode: 'UNAVAILABLE',
      status: 'FAILURE',
      categories: [],
      topStates: [],
      dataPoints: [],
      dataSource:
        'Government of India public VAHAN dashboard (parivahan.gov.in)  Ministry of Road Transport & Highways (MoRTH)',
      retrievedAt: new Date().toISOString(),
      isLiveScraped: false,
      refreshCadence: 'Daily / 24h automated ETL cache (respecting government portal rate limits)',
      historicalSnapshotsCount: allSnapshots.length,
      yoyCalculationStatus:
        'YoY calculation requires 12 months of persisted daily snapshots. Live scrape currently UNAVAILABLE.',
    };
  }

  private async buildPayload(
    states: VahanStateRegistration[],
    isLive: boolean,
  ): Promise<VahanDashboardPayload> {
    // Category volumes are not scraped from the state-registration chart; never fabricate them.
    const categories: VahanCategoryDetail[] = [];
    const dataPoints: VahanDataPointDto[] = [];
    const allSnapshots = await this.getSnapshots();

    return {
      mode: isLive ? 'LIVE_FETCH' : 'UNAVAILABLE',
      status: isLive && states.length > 0 ? 'SUCCESS' : 'FAILURE',
      categories,
      topStates: states,
      dataPoints,
      dataSource:
        'Government of India public VAHAN dashboard (parivahan.gov.in)  Ministry of Road Transport & Highways (MoRTH)',
      retrievedAt: new Date().toISOString(),
      isLiveScraped: isLive,
      refreshCadence: 'Daily / 24h automated ETL cache (respecting government portal rate limits)',
      historicalSnapshotsCount: allSnapshots.length,
      yoyCalculationStatus:
        'YoY calculation requires 12 months of persisted daily snapshots. Snapshot accumulator active.',
    };
  }
}

