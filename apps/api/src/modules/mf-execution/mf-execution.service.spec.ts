import { BseStarMfMockProvider } from './providers/bse-star-mf-mock.provider';
import { KycMockProvider } from '../kyc/providers/kyc-mock.provider';

describe('KYC & BSE StAR MF Execution (Sprint 4)', () => {
  let bseMock: BseStarMfMockProvider;
  let kycMock: KycMockProvider;

  beforeEach(() => {
    bseMock = new BseStarMfMockProvider();
    kycMock = new KycMockProvider();
  });

  describe('BseStarMfMockProvider', () => {
    it('registers client UCC successfully with valid PAN', async () => {
      const res = await bseMock.registerClient({
        clientCode: 'UCC_TEST_001',
        clientName: 'Rahul Sharma',
        pan: 'ABCDE1234F',
        dateOfBirth: '15/08/1990',
        email: 'rahul@example.com',
        mobile: '9876543210',
      });

      expect(res.success).toBe(true);
      expect(res.clientCode).toBe('UCC_TEST_001');
      expect(res.status).toBe('APPROVED');
    });

    it('registers SIP and returns registration number and next due date', async () => {
      const res = await bseMock.registerSip({
        clientCode: 'UCC_TEST_001',
        schemeCode: '119551',
        amount: 5000,
        frequency: 'MONTHLY',
        sipDay: 10,
      });

      expect(res.success).toBe(true);
      expect(res.registrationNo).toMatch(/^BSE_SIP_/);
      expect(res.bseOrderNo).toMatch(/^ORD_BSE_/);
      expect(res.status).toBe('SUCCESS');
      expect(res.sipDueDate).toBeDefined();
    });

    it('places simulated lumpsum order', async () => {
      const res = await bseMock.placeLumpsumOrder({
        clientCode: 'UCC_TEST_001',
        schemeCode: '119551',
        amount: 25000,
        paymentMode: 'UPI',
      });

      expect(res.success).toBe(true);
      expect(res.bseOrderNo).toMatch(/^LUMP_BSE_/);
    });
  });

  describe('KycMockProvider', () => {
    it('approves standard Indian PAN format via KRA', async () => {
      const res = await kycMock.verifyPanKra('ABCDE1234F', '15-08-1990');
      expect(res.isVerified).toBe(true);
      expect(res.status).toBe('verified');
      expect(res.kraProvider).toBe('cvl');
    });

    it('rejects invalid PAN format', async () => {
      const res = await kycMock.verifyPanKra('INVALID_PAN');
      expect(res.isVerified).toBe(false);
      expect(res.status).toBe('rejected');
    });
  });
});
