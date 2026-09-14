import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z
    .string()
    .url()
    .refine(
      (url) => {
        try {
          const host = new URL(url).hostname.toLowerCase();
          // Reject example/placeholder hosts that cause ENOTFOUND HOST on Render
          return !['host', 'localhost', '127.0.0.1'].includes(host) || process.env.NODE_ENV !== 'production';
        } catch {
          return false;
        }
      },
      {
        message:
          'DATABASE_URL still has a placeholder host (e.g. HOST). Set the real Supabase Postgres URI from Project Settings → Database → Connection string.',
      },
    )
    .refine(
      (url) => !/USER:PASSWORD@HOST|YOUR_DB_PASSWORD|CHANGE_ME/i.test(url),
      {
        message:
          'DATABASE_URL contains placeholder credentials. Paste the real Supabase connection URI (with your database password).',
      },
    ),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  USE_MOCK_MF_EXECUTION: z.coerce.boolean().default(true),
  USE_MOCK_KYC: z.coerce.boolean().default(true),
  USE_MOCK_PAYMENTS: z.coerce.boolean().default(true),
  USE_MOCK_MESSAGING: z.coerce.boolean().default(true),
  USE_MOCK_VIDEO: z.coerce.boolean().default(true),
  FEATURE_TRACK_B_ENABLED: z.coerce.boolean().default(false),
});

export type AppConfig = z.infer<typeof envSchema>;

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      validate: (config) => {
        const parsed = envSchema.safeParse(config);
        if (!parsed.success) {
          console.error('❌ Invalid environment configuration:');
          console.error(parsed.error.flatten().fieldErrors);
          throw new Error('Invalid env config. Check .env.example for required variables.');
        }
        return parsed.data;
      },
    }),
  ],
  exports: [NestConfigModule],
})
export class AppConfigModule {}
