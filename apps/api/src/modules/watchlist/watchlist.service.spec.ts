import { WatchlistService } from './watchlist.service';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('WatchlistService', () => {
  let service: WatchlistService;
  let mockWatchlistRepo: any;
  let mockMarketIndexService: any;
  let mockNotificationsService: any;

  beforeEach(() => {
    mockWatchlistRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((dto) => ({
        ...dto,
        id: 'wl-item-1',
        addedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
      save: jest.fn().mockImplementation((e) => Promise.resolve(e)),
      remove: jest.fn().mockResolvedValue({}),
      createQueryBuilder: jest.fn(),
    };

    mockMarketIndexService = {
      fetchQuote: jest.fn().mockImplementation(async (_ticker: string, symbol: string) => {
        if (symbol === 'TATAMOTORS') {
          return {
            symbol: 'TATAMOTORS',
            name: 'Tata Motors Limited',
            ticker: 'TATAMOTORS.NS',
            current: 685.5,
            change: 12.4,
            changePct: 1.84,
            previousClose: 673.1,
            dayHigh: 692.0,
            dayLow: 670.0,
            lastUpdated: new Date().toISOString(),
          };
        }
        if (symbol === 'RELIANCE') {
          return {
            symbol: 'RELIANCE',
            name: 'Reliance Industries Ltd',
            ticker: 'RELIANCE.NS',
            current: 2950.0,
            change: -15.0,
            changePct: -0.51,
            previousClose: 2965.0,
            dayHigh: 2980.0,
            dayLow: 2940.0,
            lastUpdated: new Date().toISOString(),
          };
        }
        return null;
      }),
    };

    mockNotificationsService = {
      sendNotification: jest.fn().mockResolvedValue({ id: 'notif-1' }),
    };

    service = new WatchlistService(
      mockWatchlistRepo,
      mockMarketIndexService,
      mockNotificationsService,
      undefined, // No BullMQ queue needed in mock
    );
  });

  describe('getWatchlist', () => {
    it('returns empty list if user has no items', async () => {
      mockWatchlistRepo.find.mockResolvedValue([]);
      const result = await service.getWatchlist('user-1');
      expect(result.items).toEqual([]);
      expect(result.totalCount).toBe(0);
    });

    it('returns enriched items with live quote data', async () => {
      mockWatchlistRepo.find.mockResolvedValue([
        {
          id: 'wl-1',
          userId: 'user-1',
          symbol: 'TATAMOTORS',
          companyName: 'Tata Motors',
          alertPriceAbove: 700.0,
          alertPriceBelow: 600.0,
          addedAt: new Date(),
          lastTriggeredAt: null,
          notes: 'Near 20-DMA support',
        },
      ]);

      const result = await service.getWatchlist('user-1');
      expect(result.totalCount).toBe(1);
      expect(result.items[0].symbol).toBe('TATAMOTORS');
      expect(result.items[0].currentPrice).toBe(685.5);
      expect(result.items[0].changePct).toBe(1.84);
      expect(result.items[0].alertAboveTriggered).toBe(false);
      expect(result.items[0].alertBelowTriggered).toBe(false);
      expect(result.items[0].distanceToAlertAbovePct).toBeGreaterThan(0);
    });
  });

  describe('addItem', () => {
    it('creates and saves new item successfully', async () => {
      mockWatchlistRepo.findOne.mockResolvedValue(null);
      const res = await service.addItem('user-1', {
        symbol: 'TATAMOTORS',
        alertPriceAbove: 720.0,
      });

      expect(res.symbol).toBe('TATAMOTORS');
      expect(res.currentPrice).toBe(685.5);
      expect(mockWatchlistRepo.save).toHaveBeenCalled();
    });

    it('throws ConflictException if symbol is already in watchlist', async () => {
      mockWatchlistRepo.findOne.mockResolvedValue({ id: 'existing' });
      await expect(
        service.addItem('user-1', { symbol: 'TATAMOTORS' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('updateItem', () => {
    it('updates alert thresholds and returns updated item', async () => {
      const existing = {
        id: 'wl-1',
        userId: 'user-1',
        symbol: 'TATAMOTORS',
        alertPriceAbove: 700,
        addedAt: new Date(),
      };
      mockWatchlistRepo.findOne.mockResolvedValue(existing);

      const updated = await service.updateItem('user-1', 'wl-1', {
        alertPriceAbove: 750,
        alertPriceBelow: 620,
      });

      expect(mockWatchlistRepo.save).toHaveBeenCalled();
      expect(updated.alertPriceAbove).toBe(750);
      expect(updated.alertPriceBelow).toBe(620);
    });

    it('throws NotFoundException if item not found for user', async () => {
      mockWatchlistRepo.findOne.mockResolvedValue(null);
      await expect(
        service.updateItem('user-1', 'invalid-id', { alertPriceAbove: 750 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeItem', () => {
    it('removes item successfully', async () => {
      mockWatchlistRepo.findOne.mockResolvedValue({ id: 'wl-1', userId: 'user-1', symbol: 'TATAMOTORS' });
      const res = await service.removeItem('user-1', 'wl-1');
      expect(res.success).toBe(true);
      expect(mockWatchlistRepo.remove).toHaveBeenCalled();
    });
  });

  describe('checkAlerts', () => {
    it('evaluates price crossing and dispatches notification when price crosses above target', async () => {
      const itemToTrigger = {
        id: 'wl-1',
        userId: 'user-1',
        symbol: 'TATAMOTORS',
        alertPriceAbove: 680.0, // Current price is 685.5 => triggers!
        alertPriceBelow: null,
        lastTriggeredAt: null,
      };

      mockWatchlistRepo.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([itemToTrigger]),
      });

      const res = await service.checkAlerts();
      expect(res.checkedCount).toBe(1);
      expect(res.triggeredCount).toBe(1);
      expect(mockNotificationsService.sendNotification).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({
          title: expect.stringContaining('crossed above target'),
        }),
      );
      expect(mockWatchlistRepo.save).toHaveBeenCalled();
    });

    it('throttles notification if alert was already triggered within 1 hour', async () => {
      const recentlyTriggered = {
        id: 'wl-1',
        userId: 'user-1',
        symbol: 'TATAMOTORS',
        alertPriceAbove: 680.0,
        alertPriceBelow: null,
        lastTriggeredAt: new Date(Date.now() - 10 * 60 * 1000), // 10 mins ago
      };

      mockWatchlistRepo.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([recentlyTriggered]),
      });

      const res = await service.checkAlerts();
      expect(res.checkedCount).toBe(1);
      expect(res.triggeredCount).toBe(0);
      expect(mockNotificationsService.sendNotification).not.toHaveBeenCalled();
    });
  });
});
