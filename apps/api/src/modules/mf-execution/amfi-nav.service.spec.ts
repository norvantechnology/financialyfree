import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { AmfiNavService } from './amfi-nav.service';
import {
  MfSchemeEntity,
  MfNavHistoryEntity,
  MfFolioEntity,
} from '../../database/entities/mf.entity';

describe('AmfiNavService (AMFI Daily NAV Integration)', () => {
  let service: AmfiNavService;

  const mockSchemeRepo = {
    count: jest.fn().mockResolvedValue(4),
    find: jest.fn().mockResolvedValue([
      {
        schemeCode: '122639',
        schemeName: 'Parag Parikh Flexi Cap Fund - Direct Plan - Growth',
        navCurrent: 82.451,
        navDate: '2026-09-01',
      },
      {
        schemeCode: '118825',
        schemeName: 'Mirae Asset Large Cap Fund - Direct Plan - Growth',
        navCurrent: 112.38,
        navDate: '2026-09-01',
      },
    ]),
    findOne: jest.fn().mockImplementation(({ where }: any) => {
      if (where.schemeCode === '122639') {
        return Promise.resolve({
          schemeCode: '122639',
          schemeName: 'Parag Parikh Flexi Cap Fund - Direct Plan - Growth',
          navCurrent: 82.451,
          navDate: '2026-09-01',
        });
      }
      return Promise.resolve(null);
    }),
    create: jest.fn((dto) => dto),
    save: jest.fn((entity) => Promise.resolve(entity)),
  };

  const mockNavHistoryRepo = {
    findOne: jest.fn().mockResolvedValue(null),
    create: jest.fn((dto) => dto),
    save: jest.fn((entity) => Promise.resolve(entity)),
    find: jest.fn().mockResolvedValue([
      { schemeCode: '122639', nav: 90.5289, navDate: '2026-09-04' },
      { schemeCode: '122639', nav: 90.1142, navDate: '2026-09-03' },
    ]),
  };

  const mockFolioRepo = {
    find: jest.fn().mockImplementation(({ where }: any) => {
      if (where?.schemeCode === '122639') {
        return Promise.resolve([
          {
            id: 'folio-1',
            schemeCode: '122639',
            units: 100,
            navCurrent: 82.451,
            currentValue: 8245,
          },
        ]);
      }
      return Promise.resolve([]);
    }),
    save: jest.fn((entity) => Promise.resolve(entity)),
  };


  const mockConfigService = {
    get: jest.fn().mockReturnValue('https://portal.amfiindia.com/spages/NAVAll.txt'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AmfiNavService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: getRepositoryToken(MfSchemeEntity), useValue: mockSchemeRepo },
        { provide: getRepositoryToken(MfNavHistoryEntity), useValue: mockNavHistoryRepo },
        { provide: getRepositoryToken(MfFolioEntity), useValue: mockFolioRepo },
      ],
    }).compile();

    service = module.get<AmfiNavService>(AmfiNavService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('parses AMFI formatted date correctly', () => {
    const parsed = (service as any).parseAmfiDate('04-Sep-2026');
    expect(parsed).toBe('2026-09-04');
  });

  it('retrieves historical nav records for a scheme', async () => {
    const history = await service.getNavHistory('122639', 10);
    expect(history.length).toBe(2);
    expect(history[0].nav).toBe(90.5289);
    expect(mockNavHistoryRepo.find).toHaveBeenCalledWith({
      where: { schemeCode: '122639' },
      order: { navDate: 'DESC' },
      take: 10,
    });
  });

  it('syncs daily NAVs by fetching feed, updating schemes, and recording history', async () => {
    const sampleAmfiData = `Scheme Code;ISIN Div Payout/ ISIN Growth;ISIN Div Reinvestment;Scheme Name;Plan;Option;Net Asset Value;Date
122639;INF879O01027;-;Parag Parikh Flexi Cap Fund;Direct Plan;Growth;90.5289;04-Sep-2026
118825;INF769K01AX2;-;Mirae Asset Large Cap Fund;Direct Plan;Growth;127.063;04-Sep-2026
118778;INF204K01K15;-;Nippon India Small Cap Fund;Direct Plan;Growth Option;210.4787;04-Sep-2026`;

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(sampleAmfiData),
    } as any);

    const res = await service.syncDailyNavs();

    expect(res.totalParsed).toBe(3);
    expect(res.schemesUpdated).toBe(2);
    expect(mockSchemeRepo.save).toHaveBeenCalled();
    expect(mockNavHistoryRepo.save).toHaveBeenCalled();
    expect(mockFolioRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        schemeCode: '122639',
        navCurrent: 90.5289,
        currentValue: 9053,
      }),
    );
  });
});
