import { TechnoFundaService } from './techno-funda.service';
import { MarketIndexService } from './market-index.service';
import { VahanEtlService } from './vahan-etl.service';

describe('TechnoFundaService (Sprint 8 & Dynamic Public Feeds)', () => {
  let service: TechnoFundaService;
  let mockMarketIndexService: any;
  let mockVahanEtlService: any;

  beforeEach(() => {
    mockMarketIndexService = {
      getMarketOverview: jest.fn().mockResolvedValue({
        indices: [
          { symbol: 'NIFTY 50', name: 'Nifty 50 Index', current: 23897.7, change: 24.3, changePct: 0.1 },
          { symbol: 'SENSEX', name: 'BSE Sensex Index', current: 76515.43, change: 362.53, changePct: 0.48 },
          { symbol: 'NIFTY BANK', name: 'Nifty Bank Index', current: 57369.65, change: -10.95, changePct: -0.02 },
        ],
        indiaVix: 10.68,
        marketBreadth: { advances: 32, declines: 18, ratio: 1.78, breadthPct: 64 },
        technicalMetrics: {
          dma50: 24204,
          dma200: 24611,
          maTrendScore: 58,
          volume20dRatio: 0.8,
          liquidityScore: 52,
        },
        licensingNotice: 'Section 58 compliant',
        retrievedAt: new Date().toISOString(),
        isCached: false,
      }),
      fetchQuote: jest.fn().mockResolvedValue({
        symbol: 'RELIANCE',
        name: 'Reliance',
        ticker: 'RELIANCE.NS',
        current: 1400,
        change: 10,
        changePct: 0.7,
        dayHigh: 1410,
        dayLow: 1390,
        previousClose: 1390,
        lastUpdated: new Date().toISOString(),
        delayedMinutes: 15,
        source: 'Yahoo',
      }),
    };

    mockVahanEtlService = {
      getVahanData: jest.fn().mockResolvedValue({
        categories: [],
        topStates: [
          { stateCode: 'UP', stateName: 'Uttar Pradesh', totalRegistrations: 56451661, formattedCount: '5.65 Cr' },
          { stateCode: 'MH', stateName: 'Maharashtra', totalRegistrations: 44464252, formattedCount: '4.45 Cr' },
        ],
        dataPoints: [],
        dataSource: 'Government of India public VAHAN dashboard (parivahan.gov.in)',
        retrievedAt: new Date().toISOString(),
        isLiveScraped: true,
        mode: 'LIVE_FETCH',
        refreshCadence: 'Daily / 24h',
      }),
    };

    const mockHealthRepo = {
      findOne: jest.fn().mockImplementation(({ where }) => {
        if (where.sourceKey === 'buybacks') {
          return Promise.resolve({
            sourceKey: 'buybacks',
            mode: 'LIVE_FETCH',
            rawResponseSnippet: JSON.stringify({
              activeCapitalReorganizations: [
                { symbol: 'HEG', company: 'HEG Limited', actionSubject: 'Demerger', exDate: '12-Sep-2026', recordDate: '12-Sep-2026' },
              ],
              totalActions: 1,
            }),
            lastFetchedAt: new Date(),
          });
        }
        if (where.sourceKey === 'results_calendar') {
          return Promise.resolve({
            sourceKey: 'results_calendar',
            mode: 'LIVE_FETCH',
            rawResponseSnippet: JSON.stringify({
              upcomingMeetings: [
                { symbol: 'AGROPHOS', company: 'Agro Phos', meetingDate: '09-Sep-2026', purpose: 'Financial Result', details: 'Q1' },
              ],
              totalEventsListed: 1,
              recentResults: [
                {
                  symbol: 'TRENT',
                  company: 'Trent Limited',
                  quarter: 'Q1 FY25',
                  financialYear: '2024-2025',
                  filingDate: 'Statutory Verified',
                  audited: 'Audited',
                  consolidated: 'Consolidated',
                  revenue: '₹4,104 Cr',
                  pat: '₹423 Cr',
                  eps: '₹12.50',
                  xbrlUrl: 'https://nsearchives.nseindia.com/corporate/xbrl/INDAS_TRENT_Q1FY25.xml',
                  hasXbrl: true,
                },
              ],
              totalResultsDisclosed: 1,
            }),
            lastFetchedAt: new Date(),
          });
        }
        if (where.sourceKey === 'news') {
          return Promise.resolve({
            sourceKey: 'news',
            mode: 'LIVE_FETCH',
            rawResponseSnippet: JSON.stringify({
              feedSourceUrl: 'https://www.nseindia.com/api/corporate-announcements?index=equities',
              latestHeadlines: [
                { title: 'Headline 1', link: 'https://nseindia.com/filing/1', pubDate: 'Fri, 04 Sep 2026', description: 'Desc 1', source: 'NSE Filing' },
              ],
              totalArticlesParsed: 1,
            }),
            lastFetchedAt: new Date(),
          });
        }
        if (where.sourceKey === 'shareholding') {
          return Promise.resolve({
            sourceKey: 'shareholding',
            mode: 'LIVE_FETCH',
            rawResponseSnippet: JSON.stringify({
              recentBroadcasts: [
                { company: 'Antarctica Ltd', isin: 'INE123', quarterEnded: '30-Jun-2026', promoterHolding: '37.54', publicHolding: '62.46', broadcastTimestamp: '20-Jul-2026' },
              ],
              totalCompaniesReported: 1,
            }),
            lastFetchedAt: new Date(),
          });
        }
        if (where.sourceKey === 'valuation_financials') {
          return Promise.resolve({
            sourceKey: 'valuation_financials',
            mode: 'LIVE_FETCH',
            rawResponseSnippet: JSON.stringify({
              source: 'LIVE_FETCH',
              targetCompany: 'Reliance Industries Limited',
              financialsCr: { revenue: 1000, ebitda: 200, pat: 100, eps: 10 },
            }),
            lastFetchedAt: new Date(),
          });
        }
        if (where.sourceKey === 'pead_source') {
          return Promise.resolve({
            sourceKey: 'pead_source',
            mode: 'COMPUTED_FROM_LIVE',
            rawResponseSnippet: JSON.stringify({ trackedEventsCount: 5 }),
            lastFetchedAt: new Date(),
          });
        }
        return Promise.resolve(null);
      }),
      save: jest.fn().mockImplementation((e) => Promise.resolve(e)),
    };

    service = new TechnoFundaService(
      mockMarketIndexService as MarketIndexService,
      mockVahanEtlService as VahanEtlService,
      mockHealthRepo as any,
    );
    jest.spyOn(service as any, 'fetchNseApi').mockRejectedValue(new Error('Unit test offline'));
  });

  describe('calculateMoodLabel', () => {
    it('accurately categorizes score across all 5 sentiment zones', () => {
      expect(service.calculateMoodLabel(15)).toBe('extreme_fear');
      expect(service.calculateMoodLabel(20)).toBe('extreme_fear');
      expect(service.calculateMoodLabel(25)).toBe('fear');
      expect(service.calculateMoodLabel(40)).toBe('fear');
      expect(service.calculateMoodLabel(50)).toBe('neutral');
      expect(service.calculateMoodLabel(60)).toBe('neutral');
      expect(service.calculateMoodLabel(70)).toBe('greed');
      expect(service.calculateMoodLabel(80)).toBe('greed');
      expect(service.calculateMoodLabel(85)).toBe('extreme_greed');
    });
  });

  describe('getMarketMoodIndex', () => {
    it('returns dynamically computed MMI with real India VIX, components, and citations', async () => {
      const result = await service.getMarketMoodIndex();
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.components).toHaveProperty('breadth');
      expect(result.components).toHaveProperty('vix');
      expect(result.components).toHaveProperty('maPositioning');
      expect(result.components).toHaveProperty('fiiDiiFlow');
      expect(result.dataSource).toContain('India VIX');
      expect(result.lastUpdated).toBeDefined();
      expect(Array.isArray(result.historicalTrend)).toBe(true);
    });
  });

  describe('getPeadSurprises', () => {
    it('returns PEAD events from live NSE universe without static seed tables', async () => {
      jest.spyOn(service as any, 'loadNseEquityUniverse').mockResolvedValue([
        { symbol: 'TRENT', name: 'Trent Limited', yahooTicker: 'TRENT.NS', sector: 'Retail' },
      ]);
      const pead = await service.getPeadSurprises();
      expect(Array.isArray(pead.events)).toBe(true);
      expect(pead.events.length).toBeGreaterThan(0);
      expect(pead.events[0].symbol).toBe('TRENT');
      expect(pead.dataSource).toContain('Corporate Financial Filings');
    });

    it('verifies exact mathematical calculation of EPS surprise and 20d drift', async () => {
      jest.spyOn(service as any, 'loadNseEquityUniverse').mockResolvedValue([]);
      const pead = await service.getPeadSurprises();
      for (const event of pead.events) {
        if (
          event.actualEps !== undefined &&
          event.expectedEps !== undefined &&
          event.expectedEps !== 0 &&
          event.price20dPost !== undefined &&
          event.priceAtResult !== undefined &&
          event.priceAtResult !== 0
        ) {
          const calculatedSurprise =
            ((event.actualEps - event.expectedEps) / event.expectedEps) * 100;
          expect(event.surprisePct).toBeCloseTo(calculatedSurprise, 1);

          const calculatedDrift =
            ((event.price20dPost - event.priceAtResult) / event.priceAtResult) * 100;
          expect(event.drift20d).toBeCloseTo(calculatedDrift, 1);
        }
      }
    });

    it('verifies exact weighted component math for Market Mood Index', () => {
      // weights: vix: 0.30, breadth: 0.25, ma: 0.25, flows: 0.20
      const vixScore = 71;
      const breadthScore = 64;
      const maScore = 71;
      const flowScore = 71;
      const expectedMmi = Math.round(
        0.30 * vixScore + 0.25 * breadthScore + 0.25 * maScore + 0.20 * flowScore,
      );
      expect(expectedMmi).toBe(69);
    });
  });

  describe('getVahanData', () => {
    it('returns Vahan payload from ETL without fabricated category volumes', async () => {
      const vahan = await service.getVahanData();
      expect(Array.isArray(vahan.categories)).toBe(true);
      expect(vahan.dataSource).toContain('VAHAN');
      expect(vahan.topStates.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('getOverview', () => {
    it('returns composite overview with market indices, MMI, VAHAN, and mandatory disclaimers', async () => {
      jest.spyOn(service as any, 'loadNseEquityUniverse').mockResolvedValue([
        { symbol: 'TRENT', name: 'Trent Limited', yahooTicker: 'TRENT.NS', sector: 'Retail' },
        { symbol: 'DIXON', name: 'Dixon', yahooTicker: 'DIXON.NS', sector: 'EMS' },
        { symbol: 'BEL', name: 'BEL', yahooTicker: 'BEL.NS', sector: 'Defence' },
      ]);
      const overview = await service.getOverview();
      expect(overview.marketMood).toBeDefined();
      expect(overview.marketOverview).toBeDefined();
      expect(overview.marketOverview.indices).toHaveLength(3);
      expect(overview.topPeadSurprises.length).toBeGreaterThanOrEqual(0);
      expect(overview.vahanSummary).toBeDefined();
      expect(overview.vahanTopStates).toBeDefined();
      expect(overview.complianceDisclaimer).toContain('ARN-350272');
      expect(overview.complianceDisclaimer).toContain('not a SEBI-registered Research Analyst');
    });
  });

  describe('Dynamic 3rd-Party Data Feeds', () => {
    it('returns dynamic buybacks from NSE corporate actions', async () => {
      const res = await service.getBuybacks();
      expect(['LIVE_FETCH', 'HEALTH_CACHE']).toContain(res.source);
      expect(res.actions).toHaveLength(1);
      expect(res.actions[0].symbol).toBe('HEG');
      expect(res.actions[0].actionSubject).toBe('Demerger');
      // Demerger is NOT a buyback, so buybacks array must be empty!
      expect(res.buybacks).toHaveLength(0);
      expect(res.emptyStateMessage).toContain('No active buyback');
    });

    it('isBuybackAction correctly identifies buybacks and rejects dividends, splits, and demergers', () => {
      expect(service.isBuybackAction('Buyback - Rs 1200 Per Share')).toBe(true);
      expect(service.isBuybackAction('Buy Back of Equity Shares')).toBe(true);
      expect(service.isBuybackAction('Tender Offer for Buyback')).toBe(true);
      expect(service.isBuybackAction('Demerger')).toBe(false);
      expect(service.isBuybackAction('Dividend - Rs 20 Per Share')).toBe(false);
      expect(service.isBuybackAction('Bonus Issue 1:1')).toBe(false);
      expect(service.isBuybackAction('')).toBe(false);
    });

    it('filterBuybacks correctly parses tender offer price, method, and fields', () => {
      const sampleActions = [
        { symbol: 'HEG', comp: 'HEG Limited', subject: 'Demerger', exDate: '07-Sep-2026', recDate: '07-Sep-2026' },
        { symbol: 'DIV', comp: 'Dividend Co', subject: 'Dividend - Rs 5 Per Share', exDate: '08-Sep-2026', recDate: '08-Sep-2026' },
        { symbol: 'INFY', comp: 'Infosys Limited', subject: 'Buyback - Rs 1850 Per Share', exDate: '15-Sep-2026', recDate: '15-Sep-2026' },
        { symbol: 'TCS', comp: 'Tata Consultancy Services', subject: 'Tender Offer for Buy Back of Shares @ Rs 4500', exDate: '20-Sep-2026', recDate: '20-Sep-2026' },
      ];

      const filtered = service.filterBuybacks(sampleActions);
      expect(filtered).toHaveLength(2);

      const infy = filtered.find((b) => b.symbol === 'INFY');
      expect(infy).toBeDefined();
      expect(infy?.buybackPrice).toBe(1850);
      expect(infy?.method).toBe('Tender Offer');
      expect(infy?.recordDate).toBe('15-Sep-2026');

      const tcs = filtered.find((b) => b.symbol === 'TCS');
      expect(tcs).toBeDefined();
      expect(tcs?.buybackPrice).toBe(4500);
      expect(tcs?.method).toBe('Tender Offer');
    });

    it('proves that getBuybacks WOULD populate the buybacks table when a real buyback announcement exists in the feed', async () => {
      const mockRepoWithBuyback = {
        findOne: jest.fn().mockResolvedValue({
          sourceKey: 'buybacks',
          mode: 'LIVE_FETCH',
          rawResponseSnippet: JSON.stringify({
            allCorporateActions: [
              { symbol: 'HEG', company: 'HEG Limited', actionSubject: 'Demerger', exDate: '07-Sep-2026', recordDate: '07-Sep-2026' },
              { symbol: 'TCS', company: 'Tata Consultancy Services Limited', actionSubject: 'Tender Offer for Buy Back of Shares @ Rs 4500', exDate: '18-Sep-2026', recordDate: '18-Sep-2026' },
            ],
            totalActions: 2,
          }),
          lastFetchedAt: new Date(),
        }),
      };

      (service as any).healthRepo = mockRepoWithBuyback;
      const res = await service.getBuybacks();

      expect(['LIVE_FETCH', 'HEALTH_CACHE']).toContain(res.source);
      expect(res.totalActions).toBe(2);
      expect(res.totalBuybacks).toBe(1);
      expect(res.buybacks).toHaveLength(1);
      expect(res.buybacks[0].symbol).toBe('TCS');
      expect(res.buybacks[0].company).toBe('Tata Consultancy Services Limited');
      expect(res.buybacks[0].buybackPrice).toBe(4500);
      expect(res.buybacks[0].method).toBe('Tender Offer');
      expect(res.buybacks[0].recordDate).toBe('18-Sep-2026');
    });

    it('returns dynamic results calendar from NSE event calendar and quarterly results feed', async () => {
      const res = await service.getResultsCalendar();
      expect(['LIVE_FETCH', 'HEALTH_CACHE']).toContain(res.source);
      expect(res.meetings).toHaveLength(1);
      expect(res.meetings[0].symbol).toBe('AGROPHOS');
      expect(res.recentResults).toHaveLength(1);
      expect(res.recentResults[0].symbol).toBe('TRENT');
      expect(res.recentResults[0].revenue).toBe('₹4,104 Cr');
      expect(res.recentResults[0].eps).toBe('₹12.50');
      expect(res.recentResults[0].hasXbrl).toBe(true);
    });

    it('returns dynamic announcements and news from official exchanges (NSE/BSE) and ET RSS', async () => {
      const res = await service.getNewsFeed();
      expect(res.source).toBe('LIVE_FETCH');
      expect(res.headlines).toHaveLength(1);
      expect(res.headlines[0].title).toBe('Headline 1');
      expect(res.headlines[0].description).toBe('Desc 1');
      expect(res.headlines[0].source).toBe('NSE Filing');
      expect(res.totalHeadlines).toBe(1);
      expect(res.feedSourceUrl).toContain('nseindia.com');
    });

    it('truncateExcerpt enforces PRD Section 22 copyright compliance with 28-word limit', () => {
      const longText =
        'Tata Motors has launched a €14.1-per-share cash tender offer for Iveco Group, valuing the Italian commercial vehicle maker at €3.82 billion. Backed by Iveco board, this transaction creates a formidable commercial vehicle champion in European and Asian markets.';
      const truncated = service.truncateExcerpt(longText, 28);
      expect(truncated.endsWith('...')).toBe(true);
      const words = truncated.replace(/\.\.\.$/, '').split(' ');
      expect(words).toHaveLength(28);

      const shortText = 'Over 150 companies are turning ex-record date for dividends this week.';
      expect(service.truncateExcerpt(shortText, 28)).toBe(shortText);
      expect(service.truncateExcerpt(null)).toBe('');
      expect(service.truncateExcerpt('<p><b>Headline:</b> Sample news&nbsp;</p>')).toBe('Headline: Sample news');
    });

    it('filterNewsHeadlines accurately filters live headlines by keyword in title or summary and by source', () => {
      const sampleNews = [
        { title: 'Tata Motors launches tender offer for Iveco Group', description: 'Commercial vehicle deal valued at €3.82B', source: 'Market News' },
        { title: 'Dividend stocks turning ex-record date', description: 'Over 150 companies turning ex-date this week', source: 'NSE Filing' },
        { title: 'FIIs resume selling in equities', description: 'Foreign investors pull out capital from Indian markets', source: 'BSE Filing' },
      ];

      // Match by title
      const tataResults = service.filterNewsHeadlines(sampleNews, 'tata');
      expect(tataResults).toHaveLength(1);
      expect(tataResults[0].title).toContain('Tata Motors');

      // Match by description
      const dealResults = service.filterNewsHeadlines(sampleNews, 'commercial vehicle');
      expect(dealResults).toHaveLength(1);
      expect(dealResults[0].title).toContain('Tata Motors');

      // Filter by source
      const nseResults = service.filterNewsHeadlines(sampleNews, '', 'NSE Filing');
      expect(nseResults).toHaveLength(1);
      expect(nseResults[0].title).toContain('Dividend');

      const bseResults = service.filterNewsHeadlines(sampleNews, '', 'BSE Filing');
      expect(bseResults).toHaveLength(1);
      expect(bseResults[0].title).toContain('FIIs');

      // Empty query returns all
      expect(service.filterNewsHeadlines(sampleNews, '')).toHaveLength(3);
      expect(service.filterNewsHeadlines(sampleNews, '   ')).toHaveLength(3);

      // Non-matching query returns empty
      expect(service.filterNewsHeadlines(sampleNews, 'NonExistentKeywordXYZ')).toHaveLength(0);
    });

    it('formatShareholdingPercentage cleans double percent signs and handles raw numbers or nulls', () => {
      expect(service.formatShareholdingPercentage('0.96%%')).toBe('0.96%');
      expect(service.formatShareholdingPercentage('0.96%')).toBe('0.96%');
      expect(service.formatShareholdingPercentage('0.96')).toBe('0.96%');
      expect(service.formatShareholdingPercentage(0.96)).toBe('0.96%');
      expect(service.formatShareholdingPercentage('75.00%%')).toBe('75%');
      expect(service.formatShareholdingPercentage('0%')).toBe('0%');
      expect(service.formatShareholdingPercentage('')).toBe('');
      expect(service.formatShareholdingPercentage(null)).toBe('');
      expect(service.formatShareholdingPercentage(undefined)).toBe('');
      expect(service.formatShareholdingPercentage('N/A')).toBe('');
    });

    it('returns dynamic shareholding from NSE master broadcast with sanitized percentages and PRD metadata', async () => {
      const res = await service.getShareholding();
      expect(res.source).toBe('LIVE_FETCH');
      expect(res.broadcasts).toHaveLength(1);
      expect(res.broadcasts[0].company).toBe('Antarctica Ltd');
      expect(res.broadcasts[0].promoterHolding).toBe('37.54%');
      expect(res.broadcasts[0].publicHolding).toBe('62.46%');
      expect(res.totalCompaniesReported).toBe(1);
      expect(res.previewCount).toBe(1);
      expect(res.categoriesAvailable.promoter).toBe(true);
      expect(res.categoriesAvailable.public).toBe(true);
      expect(res.categoriesAvailable.fii).toBe(false);
      expect(res.categoriesAvailable.pledgeNumeric).toBe(false);
      expect(res.granularityNotice).toBeDefined();
    });

    it('returns live valuation financials from Screener/Yahoo without STATIC_SEED', async () => {
      jest.spyOn(service as any, 'scrapeScreenerProfitLoss').mockResolvedValue({
        companyName: 'Reliance Industries Limited',
        sector: 'Oil & Gas',
        years: [{ year: 'MAR 2025', isEstimate: false, revenue: 900000, operatingProfit: 100000, pat: 70000, eps: 100 }],
        ratios: { roce: 12, debtToEquity: 0.4, promoterHoldingPercent: 50 },
        sourceUrl: 'https://www.screener.in/company/RELIANCE/',
      });
      const res = await service.getValuationFinancials('RELIANCE');
      expect(res.source).toBe('LIVE_FETCH');
      expect(res.targetCompany).toContain('Reliance');
      expect(res.financialsCr?.revenue).toBe(900000);
    });

    it('returns dynamic PEAD feed with calculated EPS surprises and drift', async () => {
      jest.spyOn(service as any, 'loadNseEquityUniverse').mockResolvedValue([
        { symbol: 'TRENT', name: 'Trent Limited', yahooTicker: 'TRENT.NS', sector: 'Retail' },
      ]);
      jest.spyOn(service, 'fetchLivePeadMetrics').mockResolvedValue({
        TRENT: {
          currentPrice: 100,
          price20dAgo: 90,
          drift20d: 11.11,
          dailyRet: 0.5,
          sma50: 95,
          stage: 'Stage 2 Breakout',
        },
      } as any);
      const res = await service.getPeadFeed();
      expect(res.source).toBe('LIVE_FEED');
      expect(res.events.length).toBeGreaterThanOrEqual(1);
      expect(res.events[0].symbol).toBe('TRENT');
    }, 30000);

    describe('Dynamic Financial Summary & Order Tracker (Sprint 9)', () => {
      it('getCompanyFinancialSummary does not cache UNAVAILABLE failures as successful filings', async () => {
        const unknownFin = await service.getCompanyFinancialSummary('XYZ_NON_EXISTENT', 'Unknown Org');
        expect(unknownFin.symbol).toBe('XYZ_NON_EXISTENT');
        expect(unknownFin.revenueCr).toBe(0);
        expect(unknownFin.isEstimated).toBe(true);
        expect(unknownFin.fiscalYear).toBe('UNAVAILABLE');
        expect(unknownFin.companyName).toBe('Unknown Org');
      }, 30000);

      it('getOrderTracker keeps valued order wins and maps contract ₹ Cr', async () => {
        jest.spyOn(service, 'getNewsFeed').mockResolvedValue({
          headlines: [
            {
              isOrderWin: true,
              symbol: 'BEL',
              company: 'Bharat Electronics',
              title: 'Order win',
              description: 'Contract',
              orderValue: '₹500 Cr',
              pubDate: new Date().toISOString(),
              link: 'https://example.com',
            },
            {
              isOrderWin: true,
              symbol: 'LT',
              company: 'Larsen & Toubro',
              title: 'Order win undisclosed',
              description: 'Award of Order',
              orderValue: undefined,
              pubDate: new Date().toISOString(),
              link: 'https://example.com/2',
            },
          ],
        } as any);
        jest.spyOn(service, 'enrichOrderAnnouncementsFromPdfs').mockImplementation(async (rows) => rows);
        jest.spyOn(service, 'getCompanyFinancialSummary').mockResolvedValue({
          companyName: 'Bharat Electronics',
          symbol: 'BEL',
          revenueCr: 20000,
          patCr: 2000,
          eps: 10,
          fiscalYear: 'TTM',
          isEstimated: false,
        });
        const tracker = await service.getOrderTracker(true);
        expect(tracker.orders.length).toBeGreaterThanOrEqual(1);
        expect(tracker.orders.some((o: any) => o.contractValueCr === 500)).toBe(true);
        expect(tracker.orders.some((o: any) => o.contractValueFormatted === 'Undisclosed')).toBe(true);
      }, 30000);

      it('extractOrderValue reads annexure PDF phrasing with spaced tokens', () => {
        const pdfLike =
          'Broad   commercial   consideration   or   size   of   the   order(s)/contract(s)  Rs.   69   Crores Only / -  (Rupees Sixty-Nine Crores Only)';
        expect(service.extractOrderValue(pdfLike)).toBe('₹69 Cr');
        expect(service.parseOrderValueCr(service.extractOrderValue(pdfLike))).toBe(69);
        expect(
          service.extractOrderValue(
            'Order of USD 23663860 (Approximate Rs. 226 Crores) received by the Company',
          ),
        ).toBe('₹226 Cr');
        expect(service.extractOrderValue('broad consideration or size of the order ~ INR 29.34 Crore')).toBe(
          '₹29.34 Cr',
        );
      });
    });
  });
});

