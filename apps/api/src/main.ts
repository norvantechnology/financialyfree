import 'reflect-metadata';
import dns from 'node:dns';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import type { Request, Response, NextFunction } from 'express';

// Render (and many PaaS) lack IPv6 egress — prefer IPv4 for Supabase DNS
dns.setDefaultResultOrder('ipv4first');

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'verbose'],
  });

  // ── Security Hardening: Trust Proxy & Helmet ────────────────────────
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', 1);
  expressApp.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ ok: true, service: 'financiallyfree-api' });
  });

  app.use(
    helmet({
      contentSecurityPolicy: false, // Managed via reverse proxy/Cloudflare and Next.js
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  app.use(cookieParser());

  // ── CSRF Protection: Origin & Referer Verification for Mutations ────
  const rawOrigins: (string | undefined)[] = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://05t44t95-3000.inc1.devtunnels.ms',
    'https://05t44t95-3001.inc1.devtunnels.ms',
    process.env.NEXTAUTH_URL,
    process.env.FRONTEND_URL,
    process.env.NEXT_PUBLIC_API_URL,
    process.env.API_URL,
  ];

  const allowedOrigins: string[] = Array.from(
    new Set(
      rawOrigins
        .filter((o): o is string => Boolean(o))
        .map((o) => o.replace(/\/+$/, ''))
    )
  );

  const isOriginAllowed = (originOrReferer?: string): boolean => {
    if (!originOrReferer) return false;
    const clean = originOrReferer.replace(/\/+$/, '');
    if (allowedOrigins.some((allowed) => clean === allowed || clean.startsWith(allowed))) {
      return true;
    }
    try {
      const url = new URL(originOrReferer);
      if (
        url.hostname.endsWith('.devtunnels.ms') ||
        url.hostname === 'localhost' ||
        url.hostname === '127.0.0.1'
      ) {
        return true;
      }
    } catch {
      // ignore parse error
    }
    return false;
  };

  app.use((req: Request, res: Response, next: NextFunction) => {
    // Webhook endpoints authenticate via cryptographic signatures (e.g. Razorpay, BSE StAR)
    if (req.path.includes('/webhook')) {
      return next();
    }

    const mutationMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    if (mutationMethods.includes(req.method)) {
      const origin = req.headers['origin'];
      const referer = req.headers['referer'];

      if (origin) {
        if (!isOriginAllowed(origin) && process.env.NODE_ENV === 'production') {
          return res.status(403).json({
            statusCode: 403,
            message: 'Cross-site request forgery detected. Request origin rejected.',
          });
        }
      } else if (referer) {
        if (!isOriginAllowed(referer) && process.env.NODE_ENV === 'production') {
          return res.status(403).json({
            statusCode: 403,
            message: 'Cross-site request forgery detected. Request referer rejected.',
          });
        }
      }
    }

    next();
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
    origin: (origin, callback) => {
      if (!origin || isOriginAllowed(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
  });

  // ── API Prefix ────────────────────────────────────────────────────────
  app.setGlobalPrefix('api/v1');

  // ── OpenAPI / Swagger ─────────────────────────────────────────────────
  const config = new DocumentBuilder()
    .setTitle('FinanciallyFree API')
    .setDescription(
      'Financial Research Platform API  Track A (Goal Engine, MF, LMS, Techno-Funda) + Track B scaffolded behind feature flags.',
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
    .addTag('techno-funda', 'Market Mood, Master Tracker, PEAD, Vahan Dashboard')
    .addTag('subscriptions', 'Plans & entitlements')
    .addTag('payments', 'Payments via Razorpay (mocked by default)')
    .addTag('admin', 'Admin dashboard (role-gated)')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  // Render (and most PaaS) require binding 0.0.0.0 — localhost/:: alone fails health checks
  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port, '0.0.0.0');
  console.log(`\n🚀 FinanciallyFree API running on http://0.0.0.0:${port}/api/v1`);
  console.log(`📚 Swagger docs at       http://0.0.0.0:${port}/api/docs\n`);
}

bootstrap().catch(console.error);
