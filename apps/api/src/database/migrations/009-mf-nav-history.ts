import { MigrationInterface, QueryRunner } from 'typeorm';

export class MfNavHistory1725000000009 implements MigrationInterface {
  name = 'MfNavHistory1725000000009';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create mf_nav_history table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "mf_nav_history" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "schemeCode" varchar(30) NOT NULL,
        "nav" decimal(12,4) NOT NULL,
        "navDate" date NOT NULL,
        "recordedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_mf_nav_history_scheme_date" 
      ON "mf_nav_history"("schemeCode", "navDate")
    `);

    // 2. Clean up legacy seed scheme codes to align with genuine AMFI master codes
    await queryRunner.query(`
      UPDATE "mf_schemes" 
      SET "schemeCode" = '122639' 
      WHERE "schemeCode" = '119551' AND "schemeName" ILIKE '%Parag Parikh%'
    `);

    await queryRunner.query(`
      UPDATE "mf_schemes" 
      SET "schemeCode" = '118825' 
      WHERE "schemeCode" = '120503' AND "schemeName" ILIKE '%Mirae Asset%'
    `);

    await queryRunner.query(`
      UPDATE "mf_schemes" 
      SET "schemeCode" = '120197' 
      WHERE "schemeCode" = '120847' AND "schemeName" ILIKE '%ICICI Prudential Liquid%'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "mf_nav_history" CASCADE`);
  }
}
