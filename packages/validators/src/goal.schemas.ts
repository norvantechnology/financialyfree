import { z } from 'zod';

export const createGoalSchema = z.object({
  type: z.enum(['emergency_fund', 'retirement', 'child_education', 'wealth_creation', 'custom']),
  name: z.string().min(2).max(100),
  targetAmount: z.number().positive().optional(),
  targetYear: z.number().int().min(new Date().getFullYear()).optional(),
  horizonYears: z.number().int().min(1).max(60),
  currentSavings: z.number().min(0),
  riskBand: z.enum(['conservative', 'balanced', 'growth']),
});

export const sipCalcSchema = z.object({
  targetCorpus: z.number().positive('Target corpus must be positive'),
  horizonYears: z.number().int().min(1).max(60),
  expectedReturnPct: z.number().min(1).max(30),
  currentSavings: z.number().min(0),
});

export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type SipCalcInput = z.infer<typeof sipCalcSchema>;
