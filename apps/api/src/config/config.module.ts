import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string().url(),
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
