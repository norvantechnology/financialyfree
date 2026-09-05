import { z } from 'zod';

export const createPaymentOrderSchema = z.object({
  planId: z.string().uuid(),
  currency: z.literal('INR').default('INR'),
});

export const paymentWebhookSchema = z.object({
  event: z.string(),
  payload: z.record(z.unknown()),
});

export const kycInitiateSchema = z.object({
  pan: z
    .string()
    .toUpperCase()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format (e.g. ABCDE1234F)'),
  dateOfBirth: z
    .string()
    .regex(/^\d{2}-\d{2}-\d{4}$/, 'Date must be in DD-MM-YYYY format'),
  aadhaarLast4: z.string().regex(/^\d{4}$/).optional(),
});

export type CreatePaymentOrderInput = z.infer<typeof createPaymentOrderSchema>;
export type KycInitiateInput = z.infer<typeof kycInitiateSchema>;
