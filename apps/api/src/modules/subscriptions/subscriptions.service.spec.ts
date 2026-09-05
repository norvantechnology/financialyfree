import { RazorpayMockProvider } from '../payments/providers/razorpay-mock.provider';
import { hasEntitlement, EntitlementDto } from '@ff/types';

describe('Subscriptions & Payments (Sprint 2)', () => {
  let mockProvider: RazorpayMockProvider;

  beforeEach(() => {
    mockProvider = new RazorpayMockProvider();
  });

  describe('RazorpayMockProvider', () => {
    it('creates an order with mock order id and paise amount', async () => {
      const order = await mockProvider.createOrder({
        amount: 1499900, // ₹14,999 in paise
        currency: 'INR',
        receipt: 'rcpt_test_1',
      });

      expect(order.id).toMatch(/^order_mock_/);
      expect(order.amount).toBe(1499900);
      expect(order.currency).toBe('INR');
      expect(order.status).toBe('created');
    });

    it('verifies simulated payment signatures', () => {
      const valid = mockProvider.verifyPaymentSignature({
        orderId: 'order_mock_12345',
        paymentId: 'pay_mock_12345',
        signature: 'mock_signature_success',
      });
      expect(valid).toBe(true);
    });

    it('verifies simulated order prefix signatures', () => {
      const valid = mockProvider.verifyPaymentSignature({
        orderId: 'order_mock_test_xyz',
        paymentId: 'pay_test',
        signature: 'sim_test_sig',
      });
      expect(valid).toBe(true);
    });
  });

  describe('hasEntitlement helper', () => {
    it('returns true for active lifetime entitlement', () => {
      const entitlements: EntitlementDto[] = [
        {
          id: 'e1',
          userId: 'u1',
          sku: 'course_lifetime',
          isLifetime: true,
          expiresAt: null,
          grantedAt: new Date().toISOString(),
          sourceSubscriptionId: 's1',
        },
      ];

      expect(hasEntitlement(entitlements, 'course_lifetime')).toBe(true);
      expect(hasEntitlement(entitlements, 'tools_1yr')).toBe(false);
    });

    it('correctly handles 1-year expiring entitlements', () => {
      const futureDate = new Date(Date.now() + 86400000 * 30).toISOString(); // 30 days future
      const pastDate = new Date(Date.now() - 86400000).toISOString(); // 1 day past

      const activeEntitlements: EntitlementDto[] = [
        {
          id: 'e2',
          userId: 'u1',
          sku: 'tools_1yr',
          isLifetime: false,
          expiresAt: futureDate,
          grantedAt: new Date().toISOString(),
          sourceSubscriptionId: 's1',
        },
      ];

      expect(hasEntitlement(activeEntitlements, 'tools_1yr')).toBe(true);

      const expiredEntitlements: EntitlementDto[] = [
        {
          id: 'e3',
          userId: 'u1',
          sku: 'tools_1yr',
          isLifetime: false,
          expiresAt: pastDate,
          grantedAt: new Date().toISOString(),
          sourceSubscriptionId: 's1',
        },
      ];

      expect(hasEntitlement(expiredEntitlements, 'tools_1yr')).toBe(false);
    });
  });

  describe('GST calculation logic', () => {
    it('calculates 18% GST correctly on base plan price', () => {
      const basePrice = 14999;
      const gstRate = 0.18;
      const gstAmount = Math.round(basePrice * gstRate * 100) / 100;
      const totalAmount = Math.round((basePrice + gstAmount) * 100) / 100;

      expect(gstAmount).toBe(2699.82);
      expect(totalAmount).toBe(17698.82);
    });
  });
});
