import { MigrationInterface, QueryRunner } from 'typeorm';

export class Invoices1725000000011 implements MigrationInterface {
  name = 'Invoices1725000000011';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "invoices" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "invoiceNumber" varchar(50) UNIQUE NOT NULL,
        "userId" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "subscriptionId" uuid REFERENCES "subscriptions"("id") ON DELETE SET NULL,
        "planId" uuid NOT NULL REFERENCES "plans"("id"),
        "amount" decimal(10,2) NOT NULL,
        "gstAmount" decimal(10,2) NOT NULL DEFAULT 0,
        "totalAmount" decimal(10,2) NOT NULL,
        "currency" varchar(10) NOT NULL DEFAULT 'INR',
        "status" varchar(20) NOT NULL DEFAULT 'paid',
        "paymentMethod" varchar(50) NOT NULL DEFAULT 'Razorpay (UPI)',
        "razorpayPaymentId" varchar(100),
        "paidAt" timestamptz NOT NULL DEFAULT now(),
        "createdAt" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_invoices_user" ON "invoices"("userId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_invoices_sub" ON "invoices"("subscriptionId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "invoices"`);
  }
}
