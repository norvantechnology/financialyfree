import { MigrationInterface, QueryRunner } from 'typeorm';

export class KycMf1725000000005 implements MigrationInterface {
  name = 'KycMf1725000000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. kyc_records
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "kyc_records" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "userId" uuid UNIQUE NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "pan" varchar(10) NOT NULL,
        "panMasked" varchar(10) NOT NULL,
        "dateOfBirth" varchar(10),
        "aadhaarLast4" varchar(4),
        "status" varchar(20) NOT NULL DEFAULT 'not_started',
        "kraProvider" varchar(20),
        "ucc" varchar(50),
        "rejectionReason" text,
        "verifiedAt" timestamptz,
        "metadata" jsonb,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);

    // 2. mf_schemes
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "mf_schemes" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "schemeCode" varchar(30) UNIQUE NOT NULL,
        "schemeName" varchar(255) NOT NULL,
        "amcName" varchar(150) NOT NULL,
        "category" varchar(50) NOT NULL,
        "subCategory" varchar(50) NOT NULL DEFAULT 'Growth',
        "navCurrent" decimal(10,4) NOT NULL,
        "navDate" date NOT NULL,
        "expenseRatio" decimal(5,2) NOT NULL DEFAULT 0.5,
        "exitLoad" varchar(150) NOT NULL DEFAULT 'Nil',
        "returns1yr" decimal(6,2),
        "returns3yr" decimal(6,2),
        "returns5yr" decimal(6,2),
        "riskLevel" varchar(30) NOT NULL DEFAULT 'very_high',
        "minSipAmount" decimal(10,2) NOT NULL DEFAULT 500,
        "isRecommended" boolean NOT NULL DEFAULT true,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" timestamptz NOT NULL DEFAULT now()
      )
    `);

    // 3. mf_orders
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "mf_orders" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "goalId" uuid REFERENCES "goals"("id") ON DELETE SET NULL,
        "schemeCode" varchar(30) NOT NULL,
        "orderType" varchar(20) NOT NULL DEFAULT 'sip',
        "amount" decimal(12,2) NOT NULL,
        "sipDayOfMonth" integer NOT NULL DEFAULT 10,
        "status" varchar(20) NOT NULL DEFAULT 'pending',
        "bseOrderNo" varchar(50),
        "bseRegistrationNo" varchar(50),
        "folioNumber" varchar(50),
        "placedAt" timestamptz NOT NULL DEFAULT now(),
        "settledAt" timestamptz,
        "unitsAllotted" decimal(12,4),
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_mf_orders_user" ON "mf_orders"("userId")`);

    // 4. mf_folios
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "mf_folios" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "folioNumber" varchar(50) NOT NULL,
        "amcName" varchar(150) NOT NULL,
        "schemeCode" varchar(30) NOT NULL,
        "schemeName" varchar(255) NOT NULL,
        "units" decimal(14,4) NOT NULL DEFAULT 0,
        "navCurrent" decimal(12,4) NOT NULL DEFAULT 0,
        "investedAmount" decimal(14,2) NOT NULL DEFAULT 0,
        "currentValue" decimal(14,2) NOT NULL DEFAULT 0,
        "xirr" decimal(6,2) NOT NULL DEFAULT 0,
        "lastUpdated" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_mf_folios_user" ON "mf_folios"("userId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "mf_folios" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "mf_orders" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "mf_schemes" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "kyc_records" CASCADE`);
  }
}
