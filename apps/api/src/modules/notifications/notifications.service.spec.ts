import { NotificationsService } from './notifications.service';
import { Repository } from 'typeorm';

describe('NotificationsService (Sprint 7)', () => {
  let service: NotificationsService;
  let mockNotifRepo: Partial<Repository<any>>;
  let mockConsentRepo: Partial<Repository<any>>;
  let mockWhatsApp: { sendMessage: jest.Mock };
  let mockEmail: { sendMessage: jest.Mock };

  beforeEach(() => {
    mockNotifRepo = {
      find: jest.fn(),
      count: jest.fn().mockResolvedValue(2),
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((dto) => ({
        ...dto,
        id: 'notif-1',
        createdAt: new Date(),
      })),
      save: jest.fn().mockImplementation((e) => Promise.resolve(e)),
      update: jest.fn().mockResolvedValue({ affected: 3 }),
    };

    mockConsentRepo = {
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((dto) => ({
        ...dto,
        updatedAt: new Date(),
      })),
      save: jest.fn().mockImplementation((e) => Promise.resolve({
        ...e,
        updatedAt: new Date(),
      })),
    };

    mockWhatsApp = {
      sendMessage: jest.fn().mockResolvedValue({ messageId: 'wa-1', status: 'sent' }),
    };

    mockEmail = {
      sendMessage: jest.fn().mockResolvedValue({ messageId: 'em-1', status: 'sent' }),
    };

    service = new NotificationsService(
      mockNotifRepo as any,
      mockConsentRepo as any,
      mockWhatsApp as any,
      mockEmail as any,
    );
  });

  describe('getMyNotifications', () => {
    it('returns user notifications and unread count', async () => {
      mockNotifRepo.find = jest.fn().mockResolvedValue([
        {
          id: 'n-1',
          userId: 'u-1',
          title: 'SIP Alert',
          message: 'SIP Due soon',
          type: 'sip_reminder',
          channel: 'in_app',
          isRead: false,
          createdAt: new Date(),
        },
      ]);

      const result = await service.getMyNotifications('u-1');
      expect(result.notifications).toHaveLength(1);
      expect(result.unreadCount).toBe(2);
      expect(result.notifications[0].title).toBe('SIP Alert');
    });
  });

  describe('markAsRead & markAllAsRead', () => {
    it('marks a single notification as read', async () => {
      const mockItem = { id: 'n-1', userId: 'u-1', isRead: false };
      mockNotifRepo.findOne = jest.fn().mockResolvedValue(mockItem);

      const res = await service.markAsRead('u-1', 'n-1');
      expect(res.success).toBe(true);
      expect(mockItem.isRead).toBe(true);
    });

    it('marks all user notifications as read', async () => {
      const res = await service.markAllAsRead('u-1');
      expect(res.count).toBe(3);
    });
  });

  describe('DPDP Consent Management', () => {
    it('returns default consent when no consent record exists', async () => {
      mockConsentRepo.findOne = jest.fn().mockResolvedValue(null);

      const consent = await service.getConsent('u-1');
      expect(consent.whatsappTransactional).toBe(true);
      expect(consent.whatsappMarketing).toBe(false);
      expect(consent.emailAlerts).toBe(true);
    });

    it('updates consent preferences and records IP address', async () => {
      mockConsentRepo.findOne = jest.fn().mockResolvedValue({
        userId: 'u-1',
        whatsappTransactional: true,
        whatsappMarketing: false,
        emailAlerts: true,
        emailMarketing: false,
      });

      const updated = await service.updateConsent(
        'u-1',
        { whatsappMarketing: true, emailMarketing: true },
        '103.21.144.5',
      );

      expect(updated.whatsappMarketing).toBe(true);
      expect(updated.ipAddress).toBe('103.21.144.5');
    });
  });

  describe('sendNotification with DPDP Enforcement', () => {
    it('dispatches to WhatsApp if channel requested and user consented', async () => {
      mockConsentRepo.findOne = jest.fn().mockResolvedValue({
        whatsappTransactional: true,
        emailAlerts: false,
        updatedAt: new Date(),
      });

      await service.sendNotification(
        'u-1',
        {
          userId: 'u-1',
          type: 'sip_reminder',
          channel: 'whatsapp',
          title: 'SIP Alert',
          message: 'Debit soon',
        },
        { phone: '+919876543210' },
      );

      expect(mockWhatsApp.sendMessage).toHaveBeenCalled();
      expect(mockEmail.sendMessage).not.toHaveBeenCalled();
    });

    it('does NOT dispatch to WhatsApp if user has NOT consented', async () => {
      mockConsentRepo.findOne = jest.fn().mockResolvedValue({
        whatsappTransactional: false,
        emailAlerts: false,
        updatedAt: new Date(),
      });

      await service.sendNotification(
        'u-1',
        {
          userId: 'u-1',
          type: 'sip_reminder',
          channel: 'whatsapp',
          title: 'SIP Alert',
          message: 'Debit soon',
        },
        { phone: '+919876543210' },
      );

      expect(mockWhatsApp.sendMessage).not.toHaveBeenCalled();
    });
  });

  describe('simulateTrigger', () => {
    it('creates and sends simulated SIP reminder', async () => {
      mockConsentRepo.findOne = jest.fn().mockResolvedValue({
        whatsappTransactional: true,
        emailAlerts: true,
        updatedAt: new Date(),
      });

      const notif = await service.simulateTrigger('u-1', 'sip_reminder');
      expect(notif.title).toContain('SIP Installment Due');
      expect(mockNotifRepo.create).toHaveBeenCalled();
    });
  });
});
