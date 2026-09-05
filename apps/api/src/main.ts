import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'verbose'],
  });

  // ── Global Validation ────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip unknown properties
      forbidNonWhitelisted: true,
      transform: true, // auto-transform to DTO types
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ── CORS ──────────────────────────────────────────────────────────────
  app.enableCors({
    origin: process.env.NEXT_PUBLIC_API_URL
      ? [process.env.NEXT_PUBLIC_API_URL, 'http://localhost:3000']
      : 'http://localhost:3000',
    credentials: true,
  });

  // ── API Prefix ────────────────────────────────────────────────────────
  app.setGlobalPrefix('api/v1');

  // ── OpenAPI / Swagger ─────────────────────────────────────────────────
  const config = new DocumentBuilder()
    .setTitle('FinanciallyFree API')
    .setDescription(
      'Financial Research Platform API — Track A (Goal Engine, MF, LMS, Techno-Funda) + Track B scaffolded behind feature flags.',
    )
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
    .addTag('auth', 'Authentication & session management')
    .addTag('users', 'User profile & preferences')
    .addTag('goals', 'Goal engine & SIP calculator')
    .addTag('kyc', 'KYC & KRA integration (mocked by default)')
    .addTag('mutual-funds', 'Mutual fund catalog & NAV')
    .addTag('mf-execution', 'MF order execution via BSE StAR MF (mocked by default)')
    .addTag('lms', 'Course library & LMS')
    .addTag('webinars', 'Live webinars & replays')
    .addTag('techno-funda', 'Market Mood, Master Tracker, PEAD, Vahan Dashboard')
    .addTag('subscriptions', 'Plans & entitlements')
    .addTag('payments', 'Payments via Razorpay (mocked by default)')
    .addTag('admin', 'Admin dashboard (role-gated)')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`\n🚀 FinanciallyFree API running on http://localhost:${port}/api/v1`);
  console.log(`📚 Swagger docs at       http://localhost:${port}/api/docs\n`);
}

bootstrap().catch(console.error);
