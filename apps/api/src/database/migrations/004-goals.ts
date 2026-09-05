import { MigrationInterface, QueryRunner } from 'typeorm';

export class Goals1725000004 implements MigrationInterface {
  name = 'Goals1725000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "goals" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "type" varchar(50) NOT NULL,
        "name" varchar(150) NOT NULL,
        "targetAmount" decimal(14,2) NOT NULL DEFAULT 0,
        "targetYear" integer,
        "horizonYears" integer NOT NULL,
        "currentSavings" decimal(14,2) NOT NULL DEFAULT 0,
        "riskBand" varchar(20) NOT NULL DEFAULT 'balanced',
        "expectedReturnPct" decimal(5,2) NOT NULL DEFAULT 12,
        "inflationPct" decimal(5,2) NOT NULL DEFAULT 6,
        "monthlySipRequired" decimal(12,2) NOT NULL DEFAULT 0,
        "projectedCorpus" decimal(14,2) NOT NULL DEFAULT 0,
        "assumptions" jsonb,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_goals_user" ON "goals"("userId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "goals" CASCADE`);
  }
}
