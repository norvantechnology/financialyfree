import { MigrationInterface, QueryRunner } from 'typeorm';

export class SubscriptionsPayments1725000003 implements MigrationInterface {
  name = 'SubscriptionsPayments1725000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. plans
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "plans" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "slug" varchar(50) UNIQUE NOT NULL,
        "name" varchar(150) NOT NULL,
        "description" text NOT NULL,
        "price" decimal(10,2) NOT NULL,
        "originalPrice" decimal(10,2),
        "durationMonths" integer,
        "skus" text[] NOT NULL,
        "features" text[] DEFAULT '{}',
        "isPopular" boolean DEFAULT false,
        "isActive" boolean DEFAULT true,
        "createdAt" timestamptz NOT NULL DEFAULT now()
      )
    `);

    // 2. subscriptions
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "subscriptions" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "planId" uuid NOT NULL REFERENCES "plans"("id"),
        "status" varchar(20) NOT NULL DEFAULT 'active',
        "startedAt" timestamptz NOT NULL DEFAULT now(),
        "expiresAt" timestamptz,
        "razorpaySubscriptionId" varchar(100),
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_subs_user" ON "subscriptions"("userId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_subs_plan" ON "subscriptions"("planId")`);

    // 3. entitlements
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "entitlements" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "sku" varchar(50) NOT NULL,
        "isLifetime" boolean DEFAULT false,
        "expiresAt" timestamptz,
        "grantedAt" timestamptz NOT NULL DEFAULT now(),
        "sourceSubscriptionId" uuid,
        "createdAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_entitlements_user" ON "entitlements"("userId")`);

    // 4. payment_orders
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "payment_orders" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "planId" uuid NOT NULL REFERENCES "plans"("id"),
        "amount" decimal(10,2) NOT NULL,
        "gstAmount" decimal(10,2) DEFAULT 0,
        "totalAmount" decimal(10,2) NOT NULL,
        "currency" varchar(10) DEFAULT 'INR',
        "status" varchar(20) NOT NULL DEFAULT 'created',
        "razorpayOrderId" varchar(100) UNIQUE NOT NULL,
        "razorpayPaymentId" varchar(100),
        "metadata" jsonb,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_orders_user" ON "payment_orders"("userId")`);

    // 5. payments
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "payments" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "orderId" uuid NOT NULL REFERENCES "payment_orders"("id"),
        "razorpayPaymentId" varchar(100) UNIQUE NOT NULL,
        "amount" decimal(10,2) NOT NULL,
        "currency" varchar(10) DEFAULT 'INR',
        "method" varchar(50),
        "status" varchar(20) DEFAULT 'captured',
        "errorDescription" text,
        "verifiedAt" timestamptz,
        "createdAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_payments_order" ON "payments"("orderId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "payments" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "payment_orders" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "entitlements" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "subscriptions" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "plans" CASCADE`);
  }
}
